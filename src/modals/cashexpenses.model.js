import mongoose, { Schema } from "mongoose";

const CashExpensesSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    modeOfPayment: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD"],
      required: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },

    transactionType: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    partyName: {
      type: String,
      trim: true,
    },

    paymentDetails: {
      type: String,
      trim: true,
    },

    expenseCategory: {
      type: String,
      enum: ["OFFICE_EXPENSE", "OTHERS"],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    proofBillUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const CashExpensesModel =
  mongoose.models.CashExpenses ||
  mongoose.model("CashExpenses", CashExpensesSchema);
