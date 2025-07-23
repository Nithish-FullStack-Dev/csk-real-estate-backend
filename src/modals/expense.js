import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const ExpenseSchema = new Schema(
  {
    accountant: {type: Schema.Types.ObjectId,ref: "User",required:true},
    expenseName: { type: String, required: true },
    category: {
      type: String,
      enum: ["Marketing", "Construction", "Operations", "Sales", "Administration"],
      required: true,
    },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    isApprovedByOwner: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    proof: { type: String }, // URL or file link
  },
  { timestamps: true }
);

export default model("Expense", ExpenseSchema);
