const { admin, getAdminApp, requireIdentity, sendError } = require("../_lib/firebase-admin");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const identity = await requireIdentity(req);
    const db = admin.firestore(getAdminApp());
    const userSnap = await db.collection("system_users").doc(identity.uid).get();
    if (!userSnap.exists || userSnap.data().active !== true) {
      return res.status(403).json({ error: "Usuário não cadastrado ou inativo." });
    }

    const user = userSnap.data();
    return res.status(200).json({
      uid: identity.uid,
      name: user.name || identity.name || "",
      role: identity.role || "operator",
      permissions: identity.permissions || {},
      modules: Array.isArray(identity.modules) ? identity.modules : [],
      active: true,
      mustChangePassword: user.mustChangePassword === true
    });
  } catch (error) {
    return sendError(res, error);
  }
};
