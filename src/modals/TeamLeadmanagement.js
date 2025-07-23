import mongoose from "mongoose";

const PerformanceSchema = new mongoose.Schema(
  {
    sales: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    deals: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TeamLeadManagement = new mongoose.Schema(
  {
    salesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    performance: { type: PerformanceSchema, default: {} },
    status: {
      type: String,
      enum: ["active", "training", "on-leave"],
      default: "active",
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.TeamLeads ||
  mongoose.model("TeamLeads", TeamLeadManagement);
