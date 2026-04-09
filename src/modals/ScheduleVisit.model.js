import mongoose from "mongoose";

const scheduleVisitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    preferredDate: {
      type: Date,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    },
    plot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenPlot",
    },
    land: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenLand",
    },

    timeSlot: {
      type: String,
      required: true,
      enum: [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "2:00",
        "3:00",
        "4:00",
        "5:00",
      ],
    },

    propertyType: {
      type: String,
      required: true,
      enum: ["building", "plot", "land"],
    },

    visitors: {
      type: Number,
      default: 1,
      min: 1,
      max: 6,
    },

    requirements: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "confirmed",
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "requested",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    feedback: {
      type: String,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("ScheduleVisit", scheduleVisitSchema);
