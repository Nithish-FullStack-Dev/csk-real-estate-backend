import mongoose from "mongoose";

const openPlotSchema = new mongoose.Schema(
  {
    // Basic Plot Information
    memNo: { type: String, unique: true },
    projectName: { type: String },
    plotNo: { type: String },
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
    },
    extentSqYards: { type: Number },
    plotType: {
      type: String,
      enum: ["Residential", "Commercial", "Agricultural", "Industrial"],
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
    },
    isCornerPlot: { type: Boolean, default: false },
    isGatedCommunity: { type: Boolean, default: false },

    // Financial Details
    pricePerSqYard: { type: Number },
    totalAmount: { type: Number },
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
    },
    listedDate: { type: Date, default: Date.now, required: true }, // Set required based on Zod
    availableFrom: { type: Date }, // Set required based on Zod

    // Availability & Customer Details
    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Blocked", "Under Dispute"],
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerContact: { type: String }, // Optional

    // Location & Images
    googleMapsLink: { type: String }, // Optional
    thumbnailUrl: { type: String }, // Optional, will store the URL
    images: [{ type: String }], // Optional, will store an array of URLs

    // Additional Details
    remarks: { type: String }, // Optional

    roadWidthFt: { type: Number },
    landmarkNearby: { type: String },
    brochureUrl: { type: String, default: null },
    reraApproved: { type: Boolean, default: false },
    reraNumber: { type: String, default: null },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const OpenPlot =
  mongoose.models.OpenPlot || mongoose.model("OpenPlot", openPlotSchema);

export default OpenPlot;
