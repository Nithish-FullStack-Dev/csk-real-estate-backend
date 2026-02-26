import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
    },
    propertyStatus: {
      type: String,
      enum: [
        "New",
        "Assigned",
        "Follow up",
        "In Progress",
        "Closed",
        "Rejected",
      ],
      default: "New",
      trim: true,
    },
    source: { type: String, default: "" },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null,
    },
    floorUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FloorUnit",
      default: null,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyUnit",
      default: null,
    },
    openPlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenPlot",
      default: null,
    },
    innerPlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InnerPlot",
      default: null,
    },
    openLand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenLand",
      default: null,
    },
    isPlotLead: { type: Boolean, default: false },
    isLandLead: { type: Boolean, default: false },
    isPropertyLead: { type: Boolean, default: false },
    lastContact: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

leadSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const leadId = this._id;

      // Dynamically get models (avoids circular import)
      const Commission = mongoose.model("Commission");
      const AgentSchedule = mongoose.model("AgentSchedule");
      const SiteVisit = mongoose.model("SiteVisit");

      // 1️⃣ Delete related commissions
      await Commission.deleteMany({ clientId: leadId });

      // 2️⃣ Delete agent schedules (FIX FIELD NAME IF NEEDED)
      await AgentSchedule.deleteMany({ lead: leadId });

      // 3️⃣ Delete site visits
      await SiteVisit.deleteMany({ clientId: leadId });

      next();
    } catch (error) {
      next(error);
    }
  },
);

export default mongoose.model("Lead", leadSchema);
