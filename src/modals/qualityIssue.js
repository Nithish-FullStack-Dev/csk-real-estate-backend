import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const qualityIssueSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
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
    contractor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    reported_date: {
      type: Date,
      default: Date.now,
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
      type: [String],
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

const QualityIssue = model("QualityIssue", qualityIssueSchema);
export default QualityIssue;
