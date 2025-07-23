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
},{timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
