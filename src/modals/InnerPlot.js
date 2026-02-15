import mongoose from "mongoose";

const InnerPlotSchema = new mongoose.Schema(
  {
    openPlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenPlot",
      required: true,
      index: true,
    },

    plotNo: {
      type: String,
      required: true,
    },

    wastageArea: {
      type: String,
    },

    area: {
      type: Number,
      required: true,
    },

    facing: {
      type: String,
      enum: ["North", "South", "East", "West"],
    },

    roadWidthFt: Number,

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

    remarks: String,

    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("InnerPlot", InnerPlotSchema);
