import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const siteInspectionSchema = new Schema({
  site_incharge: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  project: {
    type: Types.ObjectId,
    ref: "Project",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["completed", "planned"],
    default: "planned"
  },
  type: {
    type: String,
    enum: ["milestone","routine","quality issue"],
    required: true
  },
  locations: {
    type: String,
    required: true
  },
  photos: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
  }
}, { timestamps: true });

const SiteInspection = model("SiteInspection", siteInspectionSchema);
export default SiteInspection;
