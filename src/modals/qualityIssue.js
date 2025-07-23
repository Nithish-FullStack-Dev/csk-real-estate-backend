import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const qualityIssueSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "User", // for whom this quality issue is meant
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  project: {
    type: Types.ObjectId,
    ref: "Project",
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  contractor: {
    type: Types.ObjectId,
    ref: "User", // contractor field is pulled from Project
    required: true,
  },
  reported_date: {
    type: Date,
    default: Date.now, // sets current date automatically
  },
  severity: {
    type: String,
    enum: ["minor", "major", "critical"],
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "under_review", "resolved"],
    default: "open",
  },
  description: {
    type: String,
  },
  evidenceImages: {
    type: [String]
  }
}, { timestamps: true });

const QualityIssue = model("QualityIssue", qualityIssueSchema);
export default QualityIssue;
