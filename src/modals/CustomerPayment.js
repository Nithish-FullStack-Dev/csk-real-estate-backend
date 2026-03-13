import mongoose from "mongoose";

const customerPaymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    type: {
      type: String,
      enum: ["PAYMENT", "ADVANCE", "ADJUSTMENT"],
      default: "PAYMENT",
    },

    paymentMode: String,
    referenceNumber: String,
    remarks: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("CustomerPayment", customerPaymentSchema);
