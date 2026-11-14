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
function accountUid(username) { return "cdbarueri_" + String(username).toLowerCase().replace(/[^a-z0-9_-]/g, "_"); }

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

    if (action === "migrateLegacy") {
      if (process.env.VERCEL_ENV !== "production") {
        return reply(res, 409, { error: "A migração de contas legadas é exclusiva de Production." });
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
      const legacyPins = legacyData.pins === undefined ? {} : legacyData.pins;
      const backupRef = db.collection("cd_barueri_account_migration_backups").doc("legacy-accounts-v1");

      // Canonical hash lets us validate the complete backup without exposing legacy PIN data.
      const canonical = value => {
        if (Array.isArray(value)) return value.map(canonical);
        if (value && typeof value === "object") {
          return Object.keys(value).sort().reduce((out, key) => {
            out[key] = canonical(value[key]);
            return out;
          }, {});
        }
        return value;
      };
      const backupPayload = { users: legacyUsers, pins: legacyPins };
      const payloadText = JSON.stringify(canonical(backupPayload));
      const payloadSha256 = crypto.createHash("sha256").update(payloadText).digest("hex");
      if (Buffer.byteLength(payloadText, "utf8") > 900 * 1024) {
        return reply(res, 413, { error: "O cadastro legado excede o limite seguro para um único documento de backup. Nenhum dado foi alterado; é necessário planejar backup particionado." });
      }

      const backupSnap = await backupRef.get();
      if (!backupSnap.exists) {
        await backupRef.create({
          ...backupPayload,
          schemaVersion: 2,
          payloadSha256,
          sourcePath: "artifacts/cd-barueri-sp/public/data/config/operator_pins",
          createdAt: now,
          createdBy: actor.username
        });
      }

      const verifiedBackupSnap = await backupRef.get();
      const backup = verifiedBackupSnap.exists ? verifiedBackupSnap.data() : null;
      if (!backup || backup.schemaVersion !== 2 || !backup.users || typeof backup.users !== "object" || !Object.prototype.hasOwnProperty.call(backup, "pins")) {
        return reply(res, 409, { error: "Backup legado incompleto ou em formato antigo. Nenhuma migração ou limpeza foi executada; é necessário criar e validar um backup completo de usuários e PINs." });
      }
      const storedPayloadText = JSON.stringify(canonical({ users: backup.users, pins: backup.pins }));
      const storedHash = crypto.createHash("sha256").update(storedPayloadText).digest("hex");
      if (storedHash !== backup.payloadSha256 || storedHash !== payloadSha256) {
        return reply(res, 409, { error: "A integridade ou correspondência do backup legado não foi confirmada. Nenhuma conta foi migrada e nenhum dado legado foi removido." });
      }

      const migrated = [];
      const skipped = [];
      for (const [key, old] of Object.entries(legacyUsers)) {
        if (!old || typeof old !== "object") continue;
        const name = String(old.username || key).trim().toUpperCase();
        if (!validUsername(name)) { skipped.push(name || key); continue; }
        const ref = accountRef(name);
        const current = await ref.get();

        // Idempotency: never overwrite an account that already exists, especially its PIN hash/salt.
        if (current.exists) { skipped.push(name); continue; }

        const isPrimaryAdmin = name === "ADM";
        const provisional = isPrimaryAdmin ? null : hashPin("0000");
        const record = {
          username: name,
          role: isPrimaryAdmin ? "admin" : (["supervisor", "operator"].includes(old.role) ? old.role : "operator"),
          active: isPrimaryAdmin ? true : old.active !== false,
          operatorName: old.operatorName || null,
          ...(isPrimaryAdmin
            ? { pinSalt: old.pinSalt || "", pinHash: old.pinHash || "", pinConfigured: old.pinConfigured === true, mustChangePin: old.mustChangePin === true }
            : { ...provisional, pinConfigured: true, mustChangePin: true }),
          createdAt: old.createdAt || now,
          updatedAt: now,
          migratedFromLegacy: true
        };
        await ref.create(record);
        migrated.push(name);
      }

      const adminSnap = await accountRef("ADM").get();
      if (!adminSnap.exists) {
        return reply(res, 409, { error: "A conta ADM não foi encontrada no cadastro legado nem no cadastro privado. Nenhum dado legado foi removido.", migrated, skipped });
      }

      // Cleanup only after a complete, integrity-checked backup and confirmed ADM account.
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
      // Invalidate existing sessions before issuing a provisional PIN.
      // requireIdentity verifies revoked ID tokens on every protected API request.
      await admin.auth(getAdminApp()).revokeRefreshTokens(accountUid(username));
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
