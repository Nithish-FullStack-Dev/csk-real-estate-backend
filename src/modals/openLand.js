import mongoose from "mongoose";

const { Schema } = mongoose;

const openLandSchema = new Schema(
  {
    projectName: { type: String, trim: true, index: true },
    location: { type: String, trim: true, index: true },

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
    },

    landSize: { type: String },
    availableDate: { type: Date },
    description: { type: String },

    municipalPermission: { type: Boolean, default: false },
    reraApproved: { type: Boolean, default: false },
    reraNumber: { type: String, default: null },

    googleMapsLocation: { type: String },

    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    brochureUrl: { type: String, default: null },
    brochureFileId: { type: String, default: null },

    landArea: { type: Number },
    areaUnit: { type: String, enum: ["Sqft", "Sqyd", "Acre", "Hectare"] },

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

    roadAccessWidth: { type: String },
    fencingAvailable: { type: Boolean, default: false },
    waterFacility: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },

    ownerCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    /* ---------------------------- UPDATED PART ---------------------------- */
    interestedCustomers: [
      {
        customer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
          required: true,
        },
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    /* ---------------------------------------------------------------------- */

    soldToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    soldDate: { type: Date, default: null },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const OpenLand = mongoose.model("OpenLand", openLandSchema);
export default OpenLand;
