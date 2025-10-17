import mongoose from "mongoose";

const CommissionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    commissionAmount: {
      type: String,
      required: true,
    },
    commissionPercent: {
      type: String,
      required: true,
    },
    saleDate: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Commission ||
  mongoose.model("Commission", CommissionSchema);
