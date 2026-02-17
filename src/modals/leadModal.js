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

export default mongoose.model("Lead", leadSchema);
