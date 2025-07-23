import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

// Embedded Attendance Record Schema
const AttendanceRecordSchema = new Schema(
  {
    date: { type: Date, required: true },
    present: { type: Number, required: true },
    absent: { type: Number, required: true },
    remarks: { type: String },
  },
  { _id: true, timestamps: true }
);

// Embedded Wage History Schema
const WageHistorySchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    wage: { type: Number, required: true },
    reason: { type: String },
  },
  { _id: true, timestamps: true }
);

// Main LaborTeam Schema
const LaborTeamSchema = new Schema(
  {
    contractor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    supervisor: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Masonry",
        "Electrical",
        "Plumbing",
        "Carpentry",
        "Painting",
        "Other",
      ],
      required: true,
    },
    members: {
      type: Number,
      min: 1,
      required: true,
    },
    wage: {
      type: Number,
      required: true,
    },
    wageHistory: {
      type: [WageHistorySchema],
      default: [],
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    attendancePercentage: {
      type: Number,
      default: 0, // optionally store average % if needed
    },
    attendanceRecords: {
      type: [AttendanceRecordSchema],
      default: [],
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

const LaborTeam = model("LaborTeam", LaborTeamSchema);
export default LaborTeam;
