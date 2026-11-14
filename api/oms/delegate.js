const { admin, getAdminApp, requireIdentity, sendError } = require("../_lib/firebase-admin");

const APP_ID = process.env.CD_FIREBASE_APP_ID || "cd-barueri-sp";
const MODULE_KEY = "emergenciais";

function accountUid(username) {
  return "cdbarueri_" + String(username).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL_ENV !== "production") {
    res.setHeader("Allow", "POST");
    return res.status(409).json({ error: "Delegações ficam bloqueadas no Preview para proteger os dados operacionais da produção." });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const actor = await requireIdentity(req);
    const app = getAdminApp();
    const db = admin.firestore(app);
    const actorUsername = String(actor.username || "").trim().toUpperCase();
    const actorRef = db.collection("cd_barueri_accounts").doc(actorUsername);
    const actorSnap = await actorRef.get();

    if (!actorSnap.exists || actorSnap.data().active === false) {
      return res.status(403).json({ error: "Usuário não cadastrado ou inativo." });
    }

    const actorAccount = actorSnap.data();
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (body.action === "listTargets") {
      const accountsSnap = await db.collection("cd_barueri_accounts").get();
      const accounts = accountsSnap.docs
        .map(doc => doc.data())
        .filter(account => account && account.active !== false && /^[A-Z0-9._-]{2,30}$/.test(String(account.username || "")) && String(account.username).toUpperCase() !== actorUsername)
        .map(account => ({
          username: String(account.username).toUpperCase(),
          operatorName: account.operatorName || null,
          role: account.role || "operator"
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      return res.status(200).json({ accounts });
    }

    const date = String(body.date || "");
    const recordId = String(body.recordId || "").trim();
    const om = String(body.om || "").trim();
    const targetUsername = String(body.targetUsername || "").trim().toUpperCase();
    const reason = String(body.reason || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !recordId || !om ||
        !/^[A-Z0-9._-]{2,30}$/.test(targetUsername) || !reason) {
      return res.status(400).json({ error: "Informe data, identificador da ocorrência, OM, usuário destinatário e motivo." });
    }
    if (targetUsername === actorUsername) {
      return res.status(400).json({ error: "A delegação deve ser destinada a outro usuário." });
    }

    const targetRef = db.collection("cd_barueri_accounts").doc(targetUsername);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists || targetSnap.data().active === false) {
      return res.status(404).json({ error: "Usuário destinatário não encontrado ou inativo." });
    }

    const target = targetSnap.data();
    const targetUid = accountUid(targetUsername);
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
      const matches = oms.reduce((found, item, index) => {
        if (String(item.recordId || "") === recordId) found.push(index);
        return found;
      }, []);
      if (matches.length > 1) {
        const error = new Error("Identificador da ocorrência duplicado; revise os dados antes de delegar.");
        error.status = 409;
        throw error;
      }
      const index = matches.length === 1 ? matches[0] : -1;
      if (index < 0) {
        const error = new Error("OM não encontrada na data informada.");
        error.status = 404;
        throw error;
      }

      const item = { ...oms[index] };
      if (String(item.om || "").trim() !== om) {
        const error = new Error("A OM não corresponde à ocorrência selecionada.");
        error.status = 409;
        throw error;
      }
      if (item.status === "CANCELADA" ||
          !(item.isEmergencial || item.status === "EMERGENCIAL")) {
        const error = new Error("A OM não está ativa na fila de Emergenciais.");
        error.status = 409;
        throw error;
      }

      const previousUid = item.assignedToUid || null;
      const previousName = item.assignedToNameSnapshot || item.colaborador || null;
      const now = admin.firestore.Timestamp.now();
      const actorName = actorAccount.operatorName || actorUsername;
      const targetName = target.operatorName || targetUsername;
      const event = {
        action: previousUid || previousName ? "reassigned" : "assigned",
        module: MODULE_KEY,
        recordId,
        om,
        actorUid: actor.uid,
        actorUsername,
        actorNameSnapshot: actorName,
        previousTargetUid: previousUid,
        previousTargetNameSnapshot: previousName,
        targetUid,
        targetUsername,
        targetNameSnapshot: targetName,
        reason,
        timestamp: now
      };

      item.colaborador = targetName;
      item.assignedToUid = targetUid;
      item.assignedToUsername = targetUsername;
      item.assignedToNameSnapshot = targetName;
      if (!Object.prototype.hasOwnProperty.call(item, "originalAssignee")) {
        item.originalAssignee = previousName || "";
      }
      item.delegationHistory = [
        ...(Array.isArray(item.delegationHistory) ? item.delegationHistory : []),
        {
          from: previousName || "",
          to: targetName,
          by: actorName,
          role: actorAccount.role || actor.role || null,
          at: now.toDate().toISOString(),
          action: event.action,
          module: MODULE_KEY,
          actorUid: actor.uid,
          actorUsername,
          previousTargetUid: previousUid,
          targetUid,
          targetUsername,
          reason
        }
      ];
      item.updatedBy = actorName;
      item.updatedAt = now.toDate().toISOString();
      oms[index] = item;

      const auditLog = Array.isArray(data.auditLog) ? [...data.auditLog] : [];
      auditLog.unshift({
        who: actorName,
        actorUid: actor.uid,
        actorUsername,
        om,
        actionText: "OM Emergencial delegada para " + targetName + ". Motivo: " + reason,
        module: MODULE_KEY,
        targetUid,
        targetUsername,
        timestamp: now.toDate().toISOString(),
        date
      });

      transaction.update(dayRef, {
        oms,
        auditLog: auditLog.slice(0, 500),
        updatedAt: now.toDate().toISOString()
      });

      return { recordId, om, targetUid, targetUsername, targetName, previousTargetUid: previousUid };
    });

    return res.status(200).json({ ok: true, delegation: result });
  } catch (error) {
    return sendError(res, error);
  }
};
