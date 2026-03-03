import mongoose from "mongoose";
import crypto from "crypto";
import { AuditLog } from "../modals/auditLog.model.js";

// ─── Collections to audit ────────────────────────────────────────────────────
const WATCHED_COLLECTIONS = new Set([
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
  "commissions",
]);

const EXCLUDED_COLLECTIONS = new Set(["users", "auditlogs"]);

// ─── Dedup config ─────────────────────────────────────────────────────────────
// Two events with the same fingerprint within this window are treated as one.
const DEDUP_WINDOW_MS = 2000;

/** In-memory dedup store: fingerprint → expiry timestamp */
const dedupCache = new Map();

/** Periodically purge expired entries so memory doesn't grow unbounded. */
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of dedupCache) {
    if (now > expiry) dedupCache.delete(key);
  }
}, 10_000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a deterministic fingerprint for a change event so we can
 * de-duplicate rapid-fire events that represent the same logical write.
 */
const buildFingerprint = (
  operationType,
  collection,
  documentId,
  updatedFields,
) => {
  const fieldKeys = updatedFields
    ? Object.keys(updatedFields).sort().join(",")
    : "";
  const raw = `${operationType}|${collection}|${documentId}|${fieldKeys}`;
  return crypto.createHash("md5").update(raw).digest("hex");
};

/**
 * Returns true if this event is a duplicate and should be skipped.
 * Registers the fingerprint when it is NOT a duplicate.
 */
const isDuplicate = (fingerprint) => {
  const now = Date.now();
  if (dedupCache.has(fingerprint) && dedupCache.get(fingerprint) > now) {
    return true;
  }
  dedupCache.set(fingerprint, now + DEDUP_WINDOW_MS);
  return false;
};

/** Extracts the acting user's ObjectId from wherever it may live in the event. */
const extractUserId = (change) => {
  const { fullDocument, updateDescription, fullDocumentBeforeChange } = change;

  const raw =
    updateDescription?.updatedFields?.deletedBy ??
    updateDescription?.updatedFields?.updatedBy ??
    fullDocument?.deletedBy ??
    fullDocument?.updatedBy ??
    fullDocument?.createdBy ??
    fullDocumentBeforeChange?.deletedBy ??
    fullDocumentBeforeChange?.updatedBy ??
    fullDocumentBeforeChange?.createdBy ??
    null;

  if (!raw) return null;
  try {
    return new mongoose.Types.ObjectId(raw);
  } catch {
    return null;
  }
};

/**
 * Maps a raw MongoDB change event → a clean audit document.
 * Returns null when the event should be ignored.
 */
const buildAuditDoc = (change) => {
  const {
    operationType,
    ns,
    documentKey,
    fullDocument,
    updateDescription,
    fullDocumentBeforeChange,
  } = change;

  // ── Guard clauses ──────────────────────────────────────────────────────────
  if (!ns?.coll || !ns?.db || !documentKey?._id) return null;
  if (!WATCHED_COLLECTIONS.has(ns.coll)) return null;
  if (EXCLUDED_COLLECTIONS.has(ns.coll)) return null;

  const userId = extractUserId(change);

  const base = {
    database: ns.db,
    collectionName: ns.coll,
    documentId: documentKey._id,
    userId,
  };

  // ── INSERT / REPLACE ───────────────────────────────────────────────────────
  if (operationType === "insert" || operationType === "replace") {
    const fingerprint = buildFingerprint(
      operationType,
      ns.coll,
      documentKey._id,
      null,
    );
    if (isDuplicate(fingerprint)) return null;

    return {
      ...base,
      operationType,
      fullDocument,
      updatedFields: null,
      removedFields: [],
      previousFields: null,
    };
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  if (operationType === "update") {
    const updatedFields = updateDescription?.updatedFields ?? {};
    const removedFields = updateDescription?.removedFields ?? [];

    // Skip pure housekeeping updates (only `updatedAt` changed)
    const meaningfulKeys = Object.keys(updatedFields).filter(
      (k) => k !== "updatedAt",
    );
    if (meaningfulKeys.length === 0 && removedFields.length === 0) return null;

    // ── Deduplication ──────────────────────────────────────────────────────
    const fingerprint = buildFingerprint(
      "update",
      ns.coll,
      documentKey._id,
      updatedFields,
    );
    if (isDuplicate(fingerprint)) return null;

    // ── Previous-field snapshot ────────────────────────────────────────────
    let previousFields = null;
    if (fullDocumentBeforeChange && meaningfulKeys.length) {
      previousFields = Object.fromEntries(
        meaningfulKeys.map((key) => [key, fullDocumentBeforeChange[key]]),
      );
    }

    // ── Soft-delete detection ──────────────────────────────────────────────
    const isSoftDelete =
      updatedFields?.isDeleted === true &&
      fullDocumentBeforeChange?.isDeleted !== true;

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

// ─── Stream lifecycle ─────────────────────────────────────────────────────────

let streamInstance = null;
let restartTimer = null;

const PIPELINE = [
  {
    $match: {
      operationType: { $in: ["insert", "update", "replace"] },
      "ns.coll": { $in: [...WATCHED_COLLECTIONS] },
    },
  },
];

const STREAM_OPTIONS = {
  fullDocument: "updateLookup",
  fullDocumentBeforeChange: "whenAvailable",
};

export const stopStream = async () => {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  if (streamInstance) {
    try {
      await streamInstance.close();
    } catch {
      // ignore — stream may already be closed
    }
    streamInstance = null;
  }
  global.__AUDIT_STREAM_RUNNING__ = false;
};

const scheduleRestart = (delayMs = 3000) => {
  if (restartTimer) return; // already scheduled
  restartTimer = setTimeout(async () => {
    restartTimer = null;
    await stopStream();
    await startStream();
  }, delayMs);
};

export const startStream = async () => {
  if (global.__AUDIT_STREAM_RUNNING__) {
    return; // idempotent — safe to call multiple times
  }

  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠ Audit stream: MongoDB not ready, retrying in 3 s…");
    scheduleRestart(3000);
    return;
  }

  global.__AUDIT_STREAM_RUNNING__ = true;

  try {
    streamInstance = mongoose.connection.watch(PIPELINE, STREAM_OPTIONS);
  } catch (err) {
    console.error("Audit stream: failed to open watch cursor:", err);
    global.__AUDIT_STREAM_RUNNING__ = false;
    scheduleRestart(5000);
    return;
  }

  console.log(
    `✅ Audit Change Stream running on DB: ${mongoose.connection.name}`,
  );

  streamInstance.on("change", async (change) => {
    try {
      const auditDoc = buildAuditDoc(change);
      if (!auditDoc) return;

      await AuditLog.create(auditDoc);
    } catch (err) {
      // Log but never crash the stream on a write error
      console.error("Audit stream: write error:", err.message);
    }
  });

  streamInstance.on("error", (err) => {
    console.error("Audit stream: cursor error:", err.message);
    scheduleRestart();
  });

  streamInstance.on("close", () => {
    if (global.__AUDIT_STREAM_RUNNING__) {
      console.warn("Audit stream: cursor closed unexpectedly — restarting…");
      scheduleRestart();
    }
  });
};

export default startStream;
