import mongoose from "mongoose";
const { Schema } = mongoose;

const propertyDocumentSchema = new Schema({
  title: { type: String },
  fileUrl: { type: String },
  mimeType: { type: String },
  visibility: {
    type: String,
    enum: ["PURCHASER_ONLY", "PUBLIC_ENQUIRER"],
    default: "PURCHASER_ONLY",
  },
  createdAt: { type: Date, default: Date.now },
});

const PropertyUnitSchema = new Schema(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: "FloorUnit",
      required: true,
      index: true,
    },
    memNo: { type: String, required: false, index: true },
    projectName: { type: String },
    plotNo: { type: String },
    villaFacing: {
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
    extent: { type: Number },
    propertyType: {
      type: String,
      enum: ["Villa", "Apartment", "Plot", "Land Parcel"],
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerStatus: {
      type: String,
      enum: ["Purchased", "Inquiry", "Blocked", "Open"],
      default: "Open",
    },
    status: {
      type: String,
      enum: ["Available", "Sold", "Under Construction", "Reserved", "Blocked"],
      default: "Available",
      index: true,
    },
    projectStatus: {
      type: String,
      enum: ["ongoing", "upcoming", "completed"],
      default: "ongoing",
    },
    preBooking: { type: Boolean, default: false },
    contractor: { type: Schema.Types.ObjectId, ref: "User" },
    siteIncharge: { type: Schema.Types.ObjectId, ref: "User" },
    totalAmount: { type: Number, default: 0 },
    workCompleted: { type: Number, default: 0, min: 0, max: 100 },
    deliveryDate: { type: Date },
    emiScheme: { type: Boolean, default: false },
    contactNo: { type: String },
    agentId: { type: Schema.Types.ObjectId, ref: "User" },
    registrationStatus: {
      type: String,
      enum: ["Completed", "In Progress", "Pending", "Not Started"],
      default: "Not Started",
    },
    ratePlan: { type: String },
    amountReceived: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    remarks: { type: String },
    municipalPermission: { type: Boolean, default: false },
    googleMapsLocation: { type: String },
    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    documents: { type: [propertyDocumentSchema], default: [] },
    enquiryCustomerName: { type: String },
    enquiryCustomerContact: { type: String },
    purchasedCustomerName: { type: String },
    purchasedCustomerContact: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.PropertyUnit ||
  mongoose.model("PropertyUnit", PropertyUnitSchema);
