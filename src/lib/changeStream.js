import mongoose from "mongoose";
import { AuditLog } from "../modals/auditLog.model.js";

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
  "expenses",
  "cashexpenses",
  "sitevisits",
  "laborteams",
  "teamagents",
  "teamleads",
  "openplots",
  "openlands",
  "innerplots",
  "taxdocuments",
  "invoices",
  "payments",
];

const INTERNAL_AUDIT_COLLECTION = "auditlogs";

let streamInstance = null;

const extractUserId = (change) => {
  const { fullDocument, updateDescription, fullDocumentBeforeChange } = change;

  const raw =
    updateDescription?.updatedFields?.deletedBy ||
    updateDescription?.updatedFields?.updatedBy ||
    fullDocument?.deletedBy ||
    fullDocument?.updatedBy ||
    fullDocument?.createdBy ||
    fullDocumentBeforeChange?.deletedBy ||
    fullDocumentBeforeChange?.updatedBy ||
    fullDocumentBeforeChange?.createdBy ||
    null;

  if (!raw) return null;

  try {
    return new mongoose.Types.ObjectId(raw);
  } catch {
    return null;
  }
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

  if (!ns?.coll || !ns?.db) return null;
  if (!documentKey?._id) return null;

  if (!collectionsToWatch.includes(ns.coll)) return null;
  if (ns.coll === "users") return null;
  if (ns.coll === INTERNAL_AUDIT_COLLECTION) return null;

  const userId = extractUserId(change);

  const base = {
    changeEventId: change._id._data,
    database: ns.db,
    collectionName: ns.coll,
    documentId: documentKey._id,
    userId,
  };

  if (operationType === "insert" || operationType === "replace") {
    return {
      ...base,
      operationType,
      fullDocument,
      updatedFields: null,
      removedFields: [],
      previousFields: null,
    };
  }

  if (operationType === "update") {
    const updatedFields = updateDescription?.updatedFields || {};
    const removedFields = updateDescription?.removedFields || [];

    if (Object.keys(updatedFields).length === 1 && updatedFields.updatedAt) {
      return null;
    }

    let previousFields = null;

    if (fullDocumentBeforeChange && Object.keys(updatedFields).length) {
      previousFields = {};
      for (const key of Object.keys(updatedFields)) {
        previousFields[key] = fullDocumentBeforeChange[key];
      }
    }

    const wasDeletedBefore = fullDocumentBeforeChange?.isDeleted === true;
    const isDeletedNow = fullDocument?.isDeleted === true;

    const isSoftDelete =
      updatedFields?.isDeleted === true &&
      wasDeletedBefore === false &&
      isDeletedNow === true;

    return {
      ...base,
      operationType: isSoftDelete ? "delete" : "update",
      fullDocument: isSoftDelete ? fullDocument : null,
      updatedFields,
      removedFields,
      previousFields,
    };
  }

  return null;
};

export const startStream = async () => {
  if (global.__AUDIT_STREAM_RUNNING__) return;

  global.__AUDIT_STREAM_RUNNING__ = true;

  const db = mongoose.connection;
  if (db.readyState !== 1) return;

  const pipeline = [
    {
      $match: {
        operationType: { $in: ["insert", "update", "replace"] },
        "ns.coll": { $in: collectionsToWatch },
      },
    },
  ];

  const options = {
    fullDocument: "updateLookup",
    fullDocumentBeforeChange: "whenAvailable",
  };

  streamInstance = db.watch(pipeline, options);

  console.log("✅ Audit Change Stream started on DB:", db.name);

  streamInstance.on("change", async (change) => {
    try {
      const auditDoc = buildAuditDoc(change);
      if (!auditDoc) return;

      await AuditLog.create(auditDoc);
    } catch (err) {
      if (err.code === 11000) {
        return;
      }
      console.error("Audit write error:", err);
    }
  });

  streamInstance.on("error", (err) => {
    console.error("Stream error:", err);
    restartStream();
  });

  streamInstance.on("close", () => {
    console.warn("Stream closed — restarting...");
    restartStream();
  });
};

const restartStream = async () => {
  try {
    if (streamInstance) {
      await streamInstance.close();
      streamInstance = null;
    }
  } catch (err) {
    console.error("Error closing stream:", err);
  }

  global.__AUDIT_STREAM_RUNNING__ = false;

  setTimeout(() => {
    startStream();
  }, 3000);
};

export default startStream;

// contractor.model.js
// siteVisitModal.js frontend
