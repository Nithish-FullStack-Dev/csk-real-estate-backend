import mongoose from "mongoose";

const assignedToSchema = mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  assignedUntil: { type: Date },
});

const carAllocation = mongoose.Schema(
  {
    model: { type: String, default: "", required: true },
    licensePlate: { type: String, required: true, unique: true },
    status: {
      type: String,
      default: "available",
      enum: ["available", "assigned", "maintenance", "booked"],
    },
    type: {
      type: String,
      enum: ["HatchBack", "Sedan", "SUV"],
      default: "",
    },
    capacity: {
      type: String,
      enum: ["4 persons", "5 persons", "7 persons"],
      default: "",
    },
    assignedTo: assignedToSchema,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date },
    actualReturnAt: { type: Date },
    fuelLevel: { type: Number, default: 0, min: 0, max: 100 },
    mileage: { type: Number, default: 0, min: 0 },
    lastService: { type: Date },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
    usageLogs: [
      {
        agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date },
        assignedUntil: { type: Date },
        actualReturnAt: { type: Date },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

const CarAllocation = mongoose.model("CarAllocation", carAllocation);

export default CarAllocation;
