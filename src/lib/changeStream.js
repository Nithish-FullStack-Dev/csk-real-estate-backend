import mongoose from "mongoose";
import { AuditLog } from "../modals/auditLog.model.js";

let changeStream;
const collectionsToWatch = [
  "leads",
  "projects",
  "propertyunits",
  "buildings",
  "floorunits",
  "qualityissues",
  "tasks",
  "contractors",
  "customers",
  "payments",
  "purchases",
  "transactions",
  "expenses",
  "cashexpenses",
  "materials",
  "budgets",
  "invoices",
  "reports",
  "sitevisits",
  "siteinspections",
  "laborteams",
  "teamagents",
  "teamleads",
  "agentcommissions",
  "commissions",
  "agentschedules",
  "userschedules",
  "carallocations",
  "openplots",
  "openlands",
  "innerplots",
  "documents",
  "taxdocuments",
  "cmsproperties",
  "banners",
  "aboutsections",
  "contactinfos",
  "enquiryforms",
  "evidences",
  "comments",
  "departments",
];

const INTERNAL_AUDIT_COLLECTION = "auditlogs";

const restartStream = async () => {
  try {
    if (changeStream) {
      await changeStream.close();
      changeStream = null;
    }
  } catch (err) {
    console.error("Error closing change stream:", err);
  }

  console.log("Restarting change stream in 3s...");
  setTimeout(startStream, 3000);
};

const extractUserId = (change) => {
  const { fullDocument, updateDescription, fullDocumentBeforeChange } = change;

  return (
    updateDescription?.updatedFields?.updatedBy ||
    fullDocument?.updatedBy ||
    fullDocument?.createdBy ||
    fullDocumentBeforeChange?.updatedBy ||
    fullDocumentBeforeChange?.createdBy ||
    fullDocumentBeforeChange?.deletedBy ||
    null
  );
};

const buildAuditDoc = (change) => {
  const {
    operationType,
    ns,
    documentKey,
    fullDocument,
    updateDescription,
    fullDocumentBeforeChange,
  } = change;

  if (!ns || !ns.db || !ns.coll) return null;
  if (!documentKey || !documentKey._id) return null;

  // Avoid auditing our own audit collection
  if (ns.coll.toLowerCase() === INTERNAL_AUDIT_COLLECTION.toLowerCase()) {
    return null;
  }

  const userId = extractUserId(change);

  const base = {
    operationType,
    database: ns.db,
    collectionName: ns.coll,
    documentId: documentKey._id,
    userId,
  };

  if (operationType === "insert" || operationType === "replace") {
    return {
      ...base,
      fullDocument,
      updatedFields: null,
      removedFields: [],
      previousFields: null,
    };
  }

  if (operationType === "update") {
    const updatedFields = updateDescription?.updatedFields || null;
    const removedFields = updateDescription?.removedFields || [];
    let previousFields = null;

    if (fullDocumentBeforeChange && updatedFields) {
      previousFields = {};
      Object.keys(updatedFields).forEach((field) => {
        previousFields[field] = fullDocumentBeforeChange[field];
      });
    }

    return {
      ...base,
      fullDocument: null,
      updatedFields,
      removedFields,
      previousFields,
    };
  }

  if (operationType === "delete") {
    return {
      ...base,
      fullDocument: fullDocumentBeforeChange || null,
      updatedFields: null,
      removedFields: [],
      previousFields: null,
    };
  }

  return null;
};

export const startStream = async () => {
  const db = mongoose.connection;
  if (changeStream) {
    // Already running
    return;
  }
  try {
    const pipeline = [
      {
        $match: {
          operationType: { $in: ["insert", "update", "delete", "replace"] },
          "ns.coll": {
            $in: collectionsToWatch,
            $ne: INTERNAL_AUDIT_COLLECTION,
          },
        },
      },
    ];

    const options = {
      fullDocument: "updateLookup",
      fullDocumentBeforeChange: "whenAvailable",
    };

    changeStream = db.watch(pipeline, options);

    console.log("✅ Change Stream started on database:", db.name);

    changeStream.on("change", async (change) => {
      try {
        const auditDoc = buildAuditDoc(change);
        if (!auditDoc) return;
        await AuditLog.create(auditDoc);
      } catch (err) {
        console.error("Error saving audit log:", err);
      }
    });

    changeStream.on("error", (err) => {
      console.error("Change stream error:", {
        message: err.message,
        code: err.code,
        codeName: err.codeName,
      });
      restartStream();
    });

    changeStream.on("close", () => {
      console.warn("Change stream closed.");
      restartStream();
    });
  } catch (err) {
    console.error("Failed to start change stream:", err);
    setTimeout(startStream, 5000);
  }
};

export default startStream;
