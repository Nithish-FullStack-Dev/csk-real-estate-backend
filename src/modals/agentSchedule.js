import mongoose from "mongoose";

const { Schema } = mongoose;

const agentScheduleSchema = new Schema(
  {
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    type: {
      type: String,
      enum: [
        "site_visit",
        "consultation",
        "follow_up",
        "document",
        "meeting",
        "others",
      ],
      default: "site_visit",
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "pending",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
      default: "scheduled",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("AgentSchedule", agentScheduleSchema);
