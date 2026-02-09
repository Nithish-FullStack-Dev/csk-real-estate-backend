import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
const materialTypes = [
  "Cement",
  "Steel",
  "Sand",
  "Aggregate",
  "Bricks",
  "Paint",
  "Electrical",
  "Plumbing",
  "Timber",
  "Glass",
  "Tiles",
  "Hardware",
  "Chemicals",
  "Tools",
  "Other",
];
const MaterialSchema = new Schema(
  {
    contractor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: materialTypes,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
    },
    poNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      default: "",
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Ordered", "In Transit", "Delivered", "Pending", "Cancelled"],
      default: "Ordered",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);
MaterialSchema.index({ poNumber: 1, project: 1 });

// safer calculation
MaterialSchema.pre("save", function (next) {
  const qty = Number(this.quantity || 0);
  const rate = Number(this.rate || 0);
  this.totalCost = qty * rate;
  next();
});

export default model("Material", MaterialSchema);
