import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    operationType: { type: String, required: true },
    database: { type: String, required: true },
    collectionName: { type: String, required: true },
    documentId: { type: mongoose.Schema.Types.Mixed, required: true },
    fullDocument: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedFields: { type: mongoose.Schema.Types.Mixed, default: null },
    previousFields: { type: mongoose.Schema.Types.Mixed, default: null },
    removedFields: { type: [String], default: [] },
    changeEventId: { type: String, required: true, unique: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ changeEventId: 1 });
auditLogSchema.index({ collectionName: 1 });
auditLogSchema.index({ documentId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
