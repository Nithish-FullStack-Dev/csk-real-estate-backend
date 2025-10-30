import mongoose from "mongoose";

const { Schema } = mongoose;

const priceRangeSchema = new Schema({
  min: { type: Number, min: 0 },
  max: { type: Number, min: 0 },
});

const buildingSchema = new Schema(
  {
    projectName: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, index: true },
    propertyType: {
      type: String,
      enum: [
        "Villa Complex",
        "Apartment Complex",
        "Plot Development",
        "Land Parcel",
      ],
      required: true,
    },
    totalUnits: { type: Number, default: 0, min: 0 },
    availableUnits: { type: Number, default: 0, min: 0 },
    soldUnits: { type: Number, default: 0, min: 0 },
    constructionStatus: {
      type: String,
      enum: ["Completed", "Under Construction", "Planned"],
      default: "Planned",
    },
    completionDate: { type: Date },
    // priceRange: priceRangeSchema,
    thumbnailUrl: { type: String },
    images: { type: [String], default: [] },
    description: { type: String },
    municipalPermission: { type: Boolean, default: false },
    reraApproved: { type: Boolean, default: false },
    reraNumber: { type: String, default: null },
    googleMapsLocation: { type: String },
    brochureUrl: { type: String, default: null },
    brochureFileId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Building ||
  mongoose.model("Building", buildingSchema);
