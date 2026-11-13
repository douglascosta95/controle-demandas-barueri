const { admin, getAdminApp, requireIdentity } = require("./_lib/firebase-admin");

function reply(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}
function validPin(pin) { return /^\d{4}$/.test(String(pin || "")); }
function hashPin(pin, salt) {
  const crypto = require("node:crypto");
  const saltBytes = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(pin), saltBytes, 120000, 32, "sha256");
  return { pinSalt: saltBytes.toString("hex"), pinHash: hash.toString("hex") };
}
function verifyPin(pin, salt, expected) {
  if (!salt || !expected) return false;
  const crypto = require("node:crypto");
  const actual = Buffer.from(hashPin(pin, salt).pinHash, "hex");
  const target = Buffer.from(expected, "hex");
  return actual.length === target.length && crypto.timingSafeEqual(actual, target);
}
function db() { return admin.firestore(getAdminApp()); }
function legacyRef() { return db().doc("artifacts/cd-barueri-sp/public/data/config/operator_pins"); }
function accountRef(username) { return db().collection("cd_barueri_accounts").doc(username); }

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "Método não permitido." });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const action = body.action || "login";
    const auth = admin.auth(getAdminApp());

    if (action === "login") {
      const username = String(body.username || "").trim().toUpperCase();
      const pin = String(body.pin || "");
      if (!/^[A-Z0-9._-]{2,30}$/.test(username) || !validPin(pin)) return reply(res, 400, { error: "Usuário ou PIN inválido." });

      const ref = accountRef(username);
      const snap = await ref.get();
      let account = snap.exists ? snap.data() : null;
      if (!account) {
        if (username !== "ADM") {
          return reply(res, 403, { error: "A conta principal ainda precisa concluir a migração dos acessos. Solicite ao ADM que entre primeiro." });
        }
        const oldSnap = await legacyRef().get();
        const oldData = oldSnap.exists ? oldSnap.data() : {};
        const old = oldData.users && oldData.users[username];
        if (!old || old.active === false) return reply(res, 401, { error: "Usuário não encontrado ou desativado." });
        account = {
          username,
          role: username === "ADM" ? "admin" : old.role,
          active: old.active !== false,
          operatorName: old.operatorName || null,
          pinSalt: old.pinSalt || "",
          pinHash: old.pinHash || "",
          pinConfigured: old.pinConfigured === true,
          mustChangePin: old.mustChangePin === true || old.pinConfigured !== true,
          createdAt: old.createdAt || new Date().toISOString()
        };
      }
      if (account.active === false) return reply(res, 403, { error: "Conta desativada." });
      if (!["admin", "supervisor", "operator"].includes(account.role)) return reply(res, 403, { error: "Perfil inválido." });

      if (!account.pinConfigured || !account.pinHash || !account.pinSalt || account.mustChangePin) {
        if (pin !== "0000") return reply(res, 401, { error: "Use o PIN provisório 0000 para configurar seu acesso." });
        if (!validPin(body.newPin) || body.newPin === "0000" || body.newPin !== body.confirmPin) return reply(res, 400, { error: "O novo PIN deve ter quatro dígitos, ser diferente de 0000 e estar confirmado." });
        Object.assign(account, hashPin(body.newPin), { pinConfigured: true, mustChangePin: false, updatedAt: new Date().toISOString() });
      } else if (!verifyPin(pin, account.pinSalt, account.pinHash)) {
        return reply(res, 401, { error: "PIN incorreto." });
      }

      await ref.set(account, { merge: true });
      const uid = "cdbarueri_" + username.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const customToken = await auth.createCustomToken(uid, { username, role: account.role, operatorName: account.operatorName || null });
      return reply(res, 200, { customToken, user: { username, role: account.role, operatorName: account.operatorName || null, mustChangePin: false } });
    }

    if (action === "changePin") {
      const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
      if (!match) return reply(res, 401, { error: "Sessão não informada." });
      const decoded = await requireIdentity(req);
      const username = String(decoded.username || "").toUpperCase();
      if (!username || !validPin(body.currentPin) || !validPin(body.newPin) || body.newPin === "0000" || body.newPin !== body.confirmPin) {
        return reply(res, 400, { error: "Dados de alteração do PIN inválidos." });
      }
      const ref = accountRef(username);
      const snap = await ref.get();
      if (!snap.exists) return reply(res, 404, { error: "Conta não encontrada." });
      const account = snap.data();
      if (!verifyPin(body.currentPin, account.pinSalt, account.pinHash)) return reply(res, 401, { error: "PIN atual incorreto." });
      await ref.set({ ...hashPin(body.newPin), pinConfigured: true, mustChangePin: false, updatedAt: new Date().toISOString() }, { merge: true });
      return reply(res, 200, { ok: true });
    }
    return reply(res, 400, { error: "Ação não reconhecida." });
  } catch (error) {
    console.error("[auth]", error);
    return reply(res, Number.isInteger(error.status) ? error.status : 500, { error: error.status ? error.message : "Falha interna na autenticação." });
  }
};
