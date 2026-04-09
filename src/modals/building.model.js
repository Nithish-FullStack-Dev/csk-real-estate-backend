import mongoose from "mongoose";
import FloorUnit from "./floorUnit.model.js";
import PropertyUnit from "./propertyUnit.model.js";
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
        "Commercial",
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
    amenities: { type: [String], default: [] },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// buildingSchema.methods.softDelete = async function (userId) {
//   this.isDeleted = true;
//   this.deletedAt = new Date();
//   this.deletedBy = userId;
//   return this.save();
// };

// buildingSchema.methods.restore = async function (userId) {
//   this.isDeleted = false;
//   this.deletedAt = null;
//   this.deletedBy = null;
//   this.updatedBy = userId;
//   return this.save();
// };

// buildingSchema.pre(/^find/, function (next) {
//   if (!this.getOptions()?.withDeleted) {
//     this.where({ isDeleted: false });
//   }
//   next();
// });

export default mongoose.models.Building ||
  mongoose.model("Building", buildingSchema);
