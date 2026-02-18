// src\modals\openPlot.js
import mongoose from "mongoose";

const OpenPlotSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    openPlotNo: {
      type: String,
      required: true,
      unique: true,
    },

    surveyNo: {
      type: String,
    },

    approvalAuthority: {
      type: String,
      enum: ["DTCP", "HMDA", "RERA", "PANCHAYAT", "OTHER"],
    },

    /* -------- Location -------- */
    location: String,

    /* -------- Land Details -------- */
    totalArea: {
      type: Number,
      required: true,
    },

    areaUnit: {
      type: String,
      enum: ["SqFt", "SqYd", "Acre"],
      default: "SqFt",
    },

    facing: {
      type: String,
      enum: ["North", "South", "East", "West"],
    },

    roadWidthFt: Number,

    boundaries: String,

    /* -------- Legal -------- */
    titleStatus: {
      type: String,
      enum: ["Clear", "Disputed", "NA"],
      default: "Clear",
    },

    reraNo: String,
    documentNo: String,

    /* -------- Status -------- */
    status: {
      type: String,
      enum: ["Available", "Sold", "Blocked"],
      default: "Available",
    },

    remarks: String,

    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    brochureUrl: { type: String, default: null },
    brochureFileId: { type: String, default: null },

    googleMapsLocation: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("OpenPlot", OpenPlotSchema);
