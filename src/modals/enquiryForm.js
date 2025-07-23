import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const enquiryFormSchema = new mongoose.Schema(
  {
    propertyType: {
      type: String,
      default: "",
      trim: true,
    },
    budget: {
      type: String,
      required: false,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "New",
        "Enquiry",
        "Assigned",
        "Follow up",
        "In Progress",
        "Closed",
        "Rejected",
      ],
      default: "New",
      trim: true,
    },
    assignedTo: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    // --- New fields for Sales Manager workflow ---
    lastContactDate: {
      type: Date, // Store as Date object
      default: null,
    },
    project: { type: String, default: "" },
    address: { type: String, default: "" },
    nextFollowUpDate: {
      type: Date, // Store as Date object
      default: null,
    },
    timeline: [
      // Array of objects for notes and timestamps
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const EnquiryForm = model("EnquiryForm", enquiryFormSchema);

export default EnquiryForm;
