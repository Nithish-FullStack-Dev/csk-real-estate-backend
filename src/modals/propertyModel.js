import mongoose from "mongoose";

const basicInfoSchema = new mongoose.Schema({
  membershipNumber: { type: String, required: true },
  projectName: { type: String, required: true },
  plotNumber: { type: String, required: true },
  propertyType: {
    type: String,
    enum: ["Villa", "Apartment", "Plot", "Land Parcel"],
    default: "Villa",
  },
  Extent: { type: Number, required: true },
  facingDirection: {
    type: String,
    enum: [
      "East",
      "West",
      "North",
      "South",
      "North-East",
      "North-West",
      "South-East",
      "South-West",
    ],
    required: false,
  },
});

const customerInfoSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customerName: String,
  customerStatus: {
    type: String,
    enum: ["Open", "Purchased", "Inquiry", "Blocked"],
    default: "Open",
  },
  propertyStatus: {
    type: String,
    enum: ["Available", "Sold", "Under Construction", "Reserved", "Blocked"],
    default: "Available",
  },
  contactNumber: Number,
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const constructionDetailsSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  siteIncharge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  workCompleted: Number,
  deliveryDate: { type: Date, required: true },
  municipalPermission: Boolean,
});

const financialDetailsSchema = new mongoose.Schema({
  totalAmount: { type: Number, required: true },
  amountReceived: Number,
  balanceAmount: Number,
  eMIScheme: Boolean,
  registrationStatus: {
    type: String,
    enum: ["Completed", "In Progress", "Pending", "Not Started"],
    default: "Pending",
  },
  ratePlan: String,
});

const locationInfoSchema = new mongoose.Schema({
  mainPropertyImage: String,
  googleMapsLocation: String,
  additionalPropertyImages: [String],
  remarks: String,
});

const propertySchema = new mongoose.Schema(
  {
    basicInfo: basicInfoSchema,
    customerInfo: customerInfoSchema,
    constructionDetails: constructionDetailsSchema,
    financialDetails: financialDetailsSchema,
    locationInfo: locationInfoSchema,
    images: [String],
  },
  { timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);
export default Property;
