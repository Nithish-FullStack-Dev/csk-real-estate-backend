import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const userScheduleSchema = new Schema(
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
    type: {
      type: String,
      required: true,
    },
    client: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Types.ObjectId,
      ref: "Building",
      required: true,
    },
    floorUnit: {
      type: Types.ObjectId,
      ref: "FloorUnit",
      required: true,
    },
    unit: {
      type: Types.ObjectId,
      ref: "PropertyUnit",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const UserSchedule = model("UserSchedule", userScheduleSchema);
export default UserSchedule;
