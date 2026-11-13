const { admin, getAdminApp, requireIdentity, sendError } = require("./_lib/firebase-admin");
const crypto = require("node:crypto");

function reply(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}
function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(pin), salt, 120000, 32, "sha256");
  return { pinSalt: salt.toString("hex"), pinHash: hash.toString("hex") };
}
function cleanAccount(data) {
  return {
    username: data.username,
    role: data.role,
    active: data.active !== false,
    operatorName: data.operatorName || null,
    pinConfigured: data.pinConfigured === true,
    mustChangePin: data.mustChangePin === true,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}
function validUsername(value) { return /^[A-Z0-9._-]{2,30}$/.test(value); }
function accountRef(username) { return admin.firestore(getAdminApp()).collection("cd_barueri_accounts").doc(username); }

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "Método não permitido." });
  try {
    const actor = await requireIdentity(req);
    if (!["admin", "supervisor"].includes(actor.role)) {
      const error = new Error("Apenas ADM ou Supervisor podem administrar contas.");
      error.status = 403;
      throw error;
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const action = String(body.action || "");
    const username = String(body.username || "").trim().toUpperCase();
    const db = admin.firestore(getAdminApp());
    const ref = validUsername(username) ? db.collection("cd_barueri_accounts").doc(username) : null;
    const now = new Date().toISOString();

    if (action === "list") {
      const snap = await db.collection("cd_barueri_accounts").get();
      const accounts = snap.docs.map(doc => cleanAccount(doc.data())).sort((a,b) => a.username.localeCompare(b.username));
      return reply(res, 200, { accounts });
    }

    if (process.env.VERCEL_ENV !== "production") {
      return reply(res, 409, { error: "A gestão de contas fica somente leitura no Preview, pois ele compartilha o Firebase com a produção." });
    }

    if (action === "migrateLegacy") {
      if (process.env.VERCEL_ENV !== "production") {
        return reply(res, 409, { error: "A migração definitiva está bloqueada no Preview para proteger os dados compartilhados com a produção." });
      }
      if (actor.role !== "admin" || actor.username !== "ADM") {
        const error = new Error("Somente a conta ADM principal pode executar a migração.");
        error.status = 403;
        throw error;
      }
      const legacyRef = db.doc("artifacts/cd-barueri-sp/public/data/config/operator_pins");
      const legacySnap = await legacyRef.get();
      if (!legacySnap.exists) return reply(res, 404, { error: "Cadastro legado não encontrado." });
      const legacyData = legacySnap.data();
      const legacyUsers = legacyData.users && typeof legacyData.users === "object" ? legacyData.users : {};
      const backupRef = db.collection("cd_barueri_account_migration_backups").doc("legacy-accounts-v1");
      const backupSnap = await backupRef.get();
      if (!backupSnap.exists) await backupRef.create({ users: legacyUsers, sourcePath: "artifacts/cd-barueri-sp/public/data/config/operator_pins", createdAt: now, createdBy: actor.username });
      const migrated = [];
      const skipped = [];
      for (const [key, old] of Object.entries(legacyUsers)) {
        if (!old || typeof old !== "object") continue;
        const name = String(old.username || key).trim().toUpperCase();
        if (!validUsername(name)) { skipped.push(name || key); continue; }
        const ref = accountRef(name);
        const current = await ref.get();
        const isPrimaryAdmin = name === "ADM";
        if (current.exists && isPrimaryAdmin) { skipped.push(name); continue; }
        const provisional = isPrimaryAdmin ? null : hashPin("0000");
        const record = {
          username: name,
          role: isPrimaryAdmin ? "admin" : (["supervisor", "operator"].includes(old.role) ? old.role : "operator"),
          active: isPrimaryAdmin ? true : old.active !== false,
          operatorName: old.operatorName || null,
          ...(isPrimaryAdmin
            ? { pinSalt: old.pinSalt || "", pinHash: old.pinHash || "", pinConfigured: old.pinConfigured === true, mustChangePin: old.mustChangePin === true }
            : { ...provisional, pinConfigured: true, mustChangePin: true }),
          createdAt: (current.exists && current.data().createdAt) || old.createdAt || now,
          updatedAt: now,
          migratedFromLegacy: true
        };
        if (current.exists) await ref.set(record, { merge: true });
        else await ref.create(record);
        migrated.push(name);
      }
      if (!migrated.includes("ADM")) {
        const adminSnap = await accountRef("ADM").get();
        if (!adminSnap.exists) {
          return reply(res, 409, { error: "A conta ADM não foi encontrada no cadastro legado. Nenhuma conta antiga foi removida.", migrated, skipped });
        }
      }
      await legacyRef.update({
        users: admin.firestore.FieldValue.delete(),
        pins: admin.firestore.FieldValue.delete(),
        accountsMigratedAt: now,
        accountsMigratedBy: actor.username
      });
      return reply(res, 200, { ok: true, migrated, skipped, provisionalPin: "0000" });
    }

    if (!validUsername(username)) return reply(res, 400, { error: "Nome de usuário inválido." });
    if (actor.role === "supervisor" && username === "ADM") {
      const error = new Error("Supervisor não pode alterar a conta ADM.");
      error.status = 403;
      throw error;
    }

    if (action === "create") {
      const role = String(body.role || "operator");
      if (!["supervisor", "operator"].includes(role)) return reply(res, 400, { error: "Perfil de conta inválido." });
      const existing = await ref.get();
      if (existing.exists) return reply(res, 409, { error: "Já existe uma conta com esse usuário." });
      const legacy = await db.doc("artifacts/cd-barueri-sp/public/data/config/operator_pins").get();
      const legacyUsers = legacy.exists ? (legacy.data().users || {}) : {};
      if (legacyUsers[username]) return reply(res, 409, { error: "O usuário existe no cadastro legado. Migre ou arquive a conta antes de recriá-la." });
      const record = {
        username,
        role,
        active: true,
        operatorName: typeof body.operatorName === "string" && body.operatorName.trim() ? body.operatorName.trim() : null,
        ...hashPin("0000"),
        pinConfigured: true,
        mustChangePin: true,
        createdAt: now,
        updatedAt: now
      };
      await ref.create(record);
      return reply(res, 201, { account: cleanAccount(record) });
    }

    const snap = await ref.get();
    if (!snap.exists) return reply(res, 404, { error: "Conta não encontrada no cadastro privado." });
    const current = snap.data();

    if (action === "resetPin") {
      if (username === "ADM") return reply(res, 400, { error: "A conta ADM principal não pode ter o PIN redefinido por aqui." });
      await ref.set({ ...hashPin("0000"), pinConfigured: true, mustChangePin: true, updatedAt: now }, { merge: true });
      return reply(res, 200, { ok: true, username, provisionalPin: "0000", mustChangePin: true });
    }
    if (action === "setActive") {
      if (username === "ADM" && body.active === false) return reply(res, 400, { error: "A conta ADM principal não pode ser desativada por esta operação." });
      await ref.set({ active: body.active === true, updatedAt: now }, { merge: true });
      return reply(res, 200, { account: cleanAccount({ ...current, active: body.active === true, updatedAt: now }) });
    }
    if (action === "update") {
      const role = String(body.role || current.role);
      if (username === "ADM") return reply(res, 400, { error: "A conta ADM principal não pode ser alterada por esta operação." });
      if (!["supervisor", "operator"].includes(role)) return reply(res, 400, { error: "Perfil inválido para esta conta." });
      const update = {
        role,
        operatorName: typeof body.operatorName === "string" && body.operatorName.trim() ? body.operatorName.trim() : null,
        updatedAt: now
      };
      await ref.set(update, { merge: true });
      return reply(res, 200, { account: cleanAccount({ ...current, ...update }) });
    }
    return reply(res, 400, { error: "Ação não reconhecida." });
  } catch (error) {
    return sendError(res, error);
  }
};
