import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  category: { type: String }, // e.g., 'lead', 'finance', 'task'
  priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], default: 'P2' },
  deepLink: { type: String },
  entityType: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
