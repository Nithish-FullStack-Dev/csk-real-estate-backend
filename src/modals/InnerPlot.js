import mongoose from "mongoose";

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
  },
  { timestamps: true },
);

/* prevent duplicate numbering in same layout */
InnerPlotSchema.index({ openPlotId: 1, plotNo: 1 }, { unique: true });

export default mongoose.models.InnerPlot ||
  mongoose.model("InnerPlot", InnerPlotSchema);
