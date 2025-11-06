import mongoose from "mongoose";

const { Schema } = mongoose;

const openLandSchema = new Schema(
  {
    // Basic Land Details
    projectName: {
      type: String,
      //  required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      // required: true,
      trim: true,
      index: true,
    },

    landType: {
      type: String,
      enum: [
        "Agriculture",
        "Non-Agriculture",
        "Residential Land",
        "Commercial Land",
        "Industrial Land",
        "Farm Land",
        "Plotting Land",
        "Other",
      ],
      //   required: true,
    },

    // Size & Availability
    landSize: { type: String }, // e.g., "5 Acres" / "10,000 Sqft"
    availableDate: { type: Date },

    description: { type: String },

    // Legal & Permission
    municipalPermission: { type: Boolean, default: false },
    reraApproved: { type: Boolean, default: false },
    reraNumber: { type: String, default: null },

    // Location / Maps
    googleMapsLocation: { type: String },

    // Media
    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    brochureUrl: { type: String, default: null },
    brochureFileId: { type: String, default: null },
    landArea: { type: Number },
    areaUnit: { type: String, enum: ["Sqft", "Sqyd", "Acre", "Hectare"] },
    // Land Characteristics
    facing: {
      type: String,
      enum: [
        "North",
        "East",
        "West",
        "South",
        "North-East",
        "North-West",
        "South-East",
        "South-West",
        "Not Applicable",
      ],
      default: "Not Applicable",
    },

    roadAccessWidth: { type: String }, // e.g., "30ft", "60ft road"
    fencingAvailable: { type: Boolean, default: false },
    waterFacility: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },

    // Agents & References (Optional Future Linking)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.OpenLand ||
  mongoose.model("OpenLand", openLandSchema);
