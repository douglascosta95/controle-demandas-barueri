const { admin, getAdminApp, requireIdentity, sendError } = require("../_lib/firebase-admin");

const APP_ID = process.env.CD_FIREBASE_APP_ID || "cd-barueri-sp";
const MODULE_KEY = "emergenciais";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const actor = await requireIdentity(req);
    const app = getAdminApp();
    const db = admin.firestore(app);
    const actorSnap = await db.collection("system_users").doc(actor.uid).get();

    if (!actorSnap.exists || actorSnap.data().active !== true) {
      return res.status(403).json({ error: "Usuário não cadastrado ou inativo." });
    }

    const actorProfile = actorSnap.data();
    const role = actor.role || actorProfile.role;
    const canDelegate = role === "admin" ||
      (role === "supervisor" &&
       actor.permissions?.[MODULE_KEY]?.delegate === true);

    if (!canDelegate) {
      return res.status(403).json({ error: "Sem permissão para delegar OMs emergenciais." });
    }

    const body = req.body || {};
    const date = String(body.date || "");
    const om = String(body.om || "").trim();
    const targetUid = String(body.targetUid || "").trim();
    const reason = String(body.reason || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !om || !targetUid || !reason) {
      return res.status(400).json({ error: "Informe data, OM, operador destinatário e motivo." });
    }
    if (targetUid === actor.uid) {
      return res.status(400).json({ error: "A delegação deve ser destinada a outro usuário." });
    }

    const targetRef = db.collection("system_users").doc(targetUid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      return res.status(404).json({ error: "Operador destinatário não encontrado." });
    }
    const target = targetSnap.data();
    if (target.active !== true ||
        !Array.isArray(target.modules) ||
        !target.modules.includes(MODULE_KEY)) {
      return res.status(403).json({ error: "Destinatário inativo ou não habilitado para Emergenciais." });
    }

    const dayRef = db.collection("artifacts").doc(APP_ID)
      .collection("public").doc("data")
      .collection("demandas_dias").doc(date);

    const result = await db.runTransaction(async transaction => {
      const daySnap = await transaction.get(dayRef);
      if (!daySnap.exists) {
        const error = new Error("Não há dados operacionais para a data informada.");
        error.status = 404;
        throw error;
      }

      const data = daySnap.data();
      const oms = Array.isArray(data.oms) ? [...data.oms] : [];
      const index = oms.findIndex(item => String(item.om) === om);
      if (index < 0) {
        const error = new Error("OM não encontrada na data informada.");
        error.status = 404;
        throw error;
      }

      const item = { ...oms[index] };
      if (item.status === "CANCELADA" ||
          !(item.isEmergencial || item.status === "EMERGENCIAL")) {
        const error = new Error("A OM não está ativa na fila de Emergenciais.");
        error.status = 409;
        throw error;
      }

      const previousUid = item.assignedToUid || null;
      const previousName = item.assignedToNameSnapshot || item.colaborador || null;
      const now = admin.firestore.Timestamp.now();
      const event = {
        action: previousUid || previousName ? "reassigned" : "assigned",
        module: MODULE_KEY,
        om,
        actorUid: actor.uid,
        actorNameSnapshot: actorProfile.name || actor.name || "",
        previousTargetUid: previousUid,
        previousTargetNameSnapshot: previousName,
        targetUid,
        targetNameSnapshot: target.name || "",
        reason,
        timestamp: now
      };

      item.colaborador = target.name || item.colaborador || "";
      item.assignedToUid = targetUid;
      item.assignedToNameSnapshot = target.name || "";
      item.assignmentHistory = [
        ...(Array.isArray(item.assignmentHistory) ? item.assignmentHistory : []),
        event
      ];
      item.updatedBy = actorProfile.name || actor.name || actor.uid;
      item.updatedAt = now.toDate().toISOString();
      oms[index] = item;

      const auditLog = Array.isArray(data.auditLog) ? [...data.auditLog] : [];
      auditLog.unshift({
        who: actorProfile.name || actor.name || actor.uid,
        actorUid: actor.uid,
        om,
        actionText: `OM Emergencial delegada para ${target.name || targetUid}. Motivo: ${reason}`,
        module: MODULE_KEY,
        targetUid,
        timestamp: now.toDate().toISOString(),
        date
      });

      transaction.update(dayRef, {
        oms,
        auditLog: auditLog.slice(0, 500),
        updatedAt: now.toDate().toISOString()
      });

      return { om, targetUid, targetName: target.name || "", previousTargetUid: previousUid };
    });

    return res.status(200).json({ ok: true, delegation: result });
  } catch (error) {
    return sendError(res, error);
  }
};
