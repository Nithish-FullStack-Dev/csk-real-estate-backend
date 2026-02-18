import mongoose from "mongoose";
import PropertyUnit from "./propertyUnit.model.js";
const { Schema } = mongoose;

const priceRangeSchema = new Schema({
  min: { type: Number, min: 0 },
  max: { type: Number, min: 0 },
});

const floorUnitSchema = new Schema(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    floorNumber: { type: Number, required: true },
    unitType: { type: String, required: true },
    totalSubUnits: { type: Number, default: 0, min: 0 },
    availableSubUnits: { type: Number, default: 0, min: 0 },
    priceRange: priceRangeSchema,
  },
  { timestamps: true },
);

floorUnitSchema.pre("findOneAndDelete", async function (next) {
  const floor = await this.model.findOne(this.getQuery());
  if (!floor) return next();

  await PropertyUnit.deleteMany({ floorId: floor._id });
  next();
});

floorUnitSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await PropertyUnit.deleteMany({ floorId: this._id });
    next();
  },
);

floorUnitSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

export default mongoose.models.FloorUnit ||
  mongoose.model("FloorUnit", floorUnitSchema);
