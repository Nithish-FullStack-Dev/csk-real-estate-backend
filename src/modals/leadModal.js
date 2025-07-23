import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
    },
    propertyStatus: {
      type: String,
      enum: [
        "New",
        "Assigned",
        "Follow up",
        "In Progress",
        "Closed",
        "Rejected",
      ],
      default: "New",
      trim: true,
    },
    source: { type: String, default: "" },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    lastContact: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);