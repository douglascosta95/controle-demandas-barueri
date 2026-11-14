const { admin, getAdminApp, requireIdentity, sendError } = require("../_lib/firebase-admin");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const identity = await requireIdentity(req);
    const username = String(identity.username || "").trim().toUpperCase();
    const db = admin.firestore(getAdminApp());
    const accountSnap = await db.collection("cd_barueri_accounts").doc(username).get();

    if (!accountSnap.exists) {
      return res.status(403).json({ error: "Conta não cadastrada ou inativa." });
    }

    const account = accountSnap.data();
    if (account.active === false || account.role !== identity.role) {
      return res.status(403).json({ error: "Conta não cadastrada ou inativa." });
    }

    return res.status(200).json({
      uid: identity.uid,
      username,
      name: account.operatorName || username,
      role: account.role,
      operatorName: account.operatorName || null,
      permissions: identity.permissions || {},
      modules: Array.isArray(identity.modules) ? identity.modules : [],
      active: true,
      mustChangePin: account.mustChangePin === true
    });
  } catch (error) {
    return sendError(res, error);
  }
};
