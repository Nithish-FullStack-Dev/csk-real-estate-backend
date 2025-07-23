import mongoose from "mongoose";

const SiteVisitSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarAllocation",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "completed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    approvalNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

const SiteVisit = mongoose.model("SiteVisit", SiteVisitSchema);
export default SiteVisit;
