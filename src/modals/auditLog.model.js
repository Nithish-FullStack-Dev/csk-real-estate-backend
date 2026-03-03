import mongoose from "mongoose";
import crypto from "crypto";

const auditLogSchema = new mongoose.Schema(
  {
    operationType: {
      type: String,
      required: true,
      enum: ["insert", "update", "replace", "delete"],
    },
    database: { type: String, required: true },
    collectionName: { type: String, required: true },
    documentId: { type: mongoose.Schema.Types.Mixed, required: true },

    fullDocument: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedFields: { type: mongoose.Schema.Types.Mixed, default: null },
    previousFields: { type: mongoose.Schema.Types.Mixed, default: null },
    removedFields: { type: [String], default: [] },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /**
     * Deduplication fingerprint — a hash of the logical event identity.
     * A unique sparse index on (fingerprint + createdAt bucket) prevents
     * duplicate documents reaching the DB even under concurrent workers.
     *
     * We store the raw fingerprint here; the TTL window is enforced by the
     * in-memory cache in changeStream.js (faster) and this index (safe-guard).
     */
    fingerprint: { type: String, default: null },
  },
  { timestamps: true },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

auditLogSchema.index({ collectionName: 1 });
auditLogSchema.index({ documentId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ createdAt: -1 });

/**
 * Compound index used as a DB-level deduplication guard.
 * Two events with the same fingerprint within the same 2-second bucket
 * will violate this unique constraint, and the second write will be a no-op.
 */
auditLogSchema.index(
  { fingerprint: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { fingerprint: { $ne: null } },
  },
);

// ─── Pre-save hook — build fingerprint automatically ─────────────────────────

auditLogSchema.pre("save", function (next) {
  if (!this.fingerprint) {
    const fieldKeys = this.updatedFields
      ? Object.keys(this.updatedFields).sort().join(",")
      : "";
    // Include a 2-second time bucket so the same logical op can be
    // re-logged after the dedup window expires.
    const bucket = Math.floor(Date.now() / 2000);
    const raw = `${this.operationType}|${this.collectionName}|${this.documentId}|${fieldKeys}|${bucket}`;
    this.fingerprint = crypto.createHash("md5").update(raw).digest("hex");
  }
  next();
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
