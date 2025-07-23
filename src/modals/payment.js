import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    accountant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    paymentNumber: {
      type: String,
      unique: true, // ensures no two payments have same number
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt fields
  }
);

export default mongoose.model("Payment", paymentSchema);
