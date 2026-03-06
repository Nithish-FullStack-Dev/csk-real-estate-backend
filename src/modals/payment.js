// src/modals/payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    accountant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    paymentNumber: {
      type: String,
      unique: true,
      required: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "cheque"],
      default: "cash",
    },

    referenceNumber: {
      type: String,
      default: null,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    nextPaymentDate: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
