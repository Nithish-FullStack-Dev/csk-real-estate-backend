import mongoose from "mongoose";

const openPlotSchema = new mongoose.Schema(
  {
    // Basic Plot Information
    memNo: { type: String, required: true, unique: true },
    projectName: { type: String, required: true },
    plotNo: { type: String, required: true },
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
      ],
      required: true,
    },
    extentSqYards: { type: Number, required: true },
    plotType: {
      type: String,
      enum: ["Residential", "Commercial", "Agricultural", "Industrial"],
      required: true,
    },
    approval: {
      type: String,
      enum: [
        "DTCP",
        "HMDA",
        "Panchayat",
        "Municipality",
        "Unapproved",
        "Other",
      ],
      required: true,
    },
    isCornerPlot: { type: Boolean, default: false },
    isGatedCommunity: { type: Boolean, default: false },

    // Financial Details
    pricePerSqYard: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    bookingAmount: { type: Number, default: 0 }, // Often a specific default
    amountReceived: { type: Number, default: 0 }, // Often a specific default
    // balanceAmount is typically calculated, but can be stored if needed.
    // Given it's in your Zod schema and handled in the frontend, keeping it here.
    balanceAmount: { type: Number, default: 0 },
    emiScheme: { type: Boolean, default: false },
    registrationStatus: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Pending Documents",
        "Pending Payment",
        "Scheduled",
        "Completed",
        "Delayed",
        "Cancelled",
      ],
      required: true,
    },
    listedDate: { type: Date, default: Date.now, required: true }, // Set required based on Zod
    availableFrom: { type: Date, required: true }, // Set required based on Zod

    // Availability & Customer Details
    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Blocked", "Under Dispute"],
      required: true,
    },
    customerName: { type: String }, // Optional
    customerContact: { type: String }, // Optional
    agentName: { type: String }, // Optional

    // Location & Images
    googleMapsLink: { type: String }, // Optional
    thumbnailUrl: { type: String }, // Optional, will store the URL
    images: [{ type: String }], // Optional, will store an array of URLs

    // Additional Details
    remarks: { type: String }, // Optional

    roadWidthFt: { type: Number },
    landmarkNearby: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const OpenPlot =
  mongoose.models.OpenPlot || mongoose.model("OpenPlot", openPlotSchema);

export default OpenPlot;

