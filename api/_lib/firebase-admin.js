const admin = require("firebase-admin");

function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não configurada na Vercel.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não contém JSON válido.");
  }

  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

async function requireIdentity(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error("Autenticação obrigatória.");
    error.status = 401;
    throw error;
  }

  const app = getAdminApp();
  try {
    const decoded = await admin.auth(app).verifyIdToken(match[1], true);
    const username = String(decoded.username || "").trim().toUpperCase();
    const role = String(decoded.role || "");
    if (!username || !["admin", "supervisor", "operator"].includes(role)) {
      const error = new Error("Sessão sem identidade ou perfil válido.");
      error.status = 401;
      throw error;
    }
    const accountSnap = await admin.firestore(app).collection("cd_barueri_accounts").doc(username).get();
    if (!accountSnap.exists || accountSnap.data().active === false || accountSnap.data().role !== role) {
      const error = new Error("Conta desativada ou perfil atualizado. Entre novamente.");
      error.status = 401;
      throw error;
    }
    return decoded;
  } catch {
    const error = new Error("Sessão inválida ou expirada.");
    error.status = 401;
    throw error;
  }
}

function sendError(res, error) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("[API]", error);
  return res.status(status).json({
    error: status >= 500 ? "Erro interno do servidor." : error.message
  });
}

module.exports = { admin, getAdminApp, requireIdentity, sendError };
