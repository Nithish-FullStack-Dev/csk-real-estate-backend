import mongoose, { Schema } from "mongoose";

const InnerPlotSchema = new mongoose.Schema(
  {
    openPlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenPlot",
      required: true,
    },

    plotNo: {
      type: String,
      required: true,
    },

    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },

    area: {
      type: Number,
      required: true,
    },

    facing: {
      type: String,
      enum: ["North", "South", "East", "West"],
    },

    plotType: {
      type: String,
      enum: ["Residential", "Commercial", "Road", "OpenSpace", "WasteLand"],
      default: "Residential",
    },

    status: {
      type: String,
      enum: ["Available", "Sold", "Blocked"],
      default: "Available",
    },

    wastageArea: Number,
    roadWidthFt: Number,

    thumbnailUrl: String,
    images: [String],

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

/* prevent duplicate numbering in same layout */
InnerPlotSchema.index(
  { openPlotId: 1, plotNo: 1, isDeleted: 1 },
  { unique: true },
);

export default mongoose.models.InnerPlot ||
  mongoose.model("InnerPlot", InnerPlotSchema);
