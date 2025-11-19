import mongoose from "mongoose";

const { Schema } = mongoose;

const openLandSchema = new Schema(
  {
    projectName: { type: String, trim: true, required: true, index: true },
    location: { type: String, trim: true, required: true, index: true },

    surveyNumber: { type: String, default: "" },

    landType: {
      type: String,
      enum: [
        "Agriculture",
        "Non-Agriculture",
        "Residential Land",
        "Commercial Land",
        "Industrial Land",
        "Farm Land",
        "Other",
      ],
      required: true,
    },

    landStatus: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Blocked"],
      default: "Available",
    },

    landSize: { type: String },
    landArea: { type: Number },
    areaUnit: {
      type: String,
      enum: ["Sqft", "Sqyd", "Acre", "Hectare"],
    },

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

    description: { type: String },
    municipalPermission: { type: Boolean, default: false },

    reraApproved: { type: Boolean, default: false },
    reraNumber: { type: String, default: "" },

    LandApproval: {
      type: String,
      enum: [
        "DTCP",
        "HMDA",
        "Panchayat",
        "Municipality",
        "Unapproved",
        "NA",
        "Other",
      ],
      default: "NA",
    },

    availableDate: { type: Date },

    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    brochureUrl: { type: String, default: null },
    brochureFileId: { type: String, default: null },

    googleMapsLocation: { type: String },

    ownerName: {
      type: String,
      default: "",
    },

    ownerCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    interestedCustomers: [
      {
        lead: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lead",
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
    soldToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    soldDate: { type: Date, default: null },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const OpenLand = mongoose.model("OpenLand", openLandSchema);
export default OpenLand;
