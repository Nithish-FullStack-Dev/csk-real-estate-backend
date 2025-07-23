import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const PhaseSchema = new Schema({
  name: {
    type: String,
    enum: [
      "Marketing",
      "Construction",
      "Operations",
      "Sales",
      "Administration",
    ],
    required: true,
  },
  budget: {
    type: Number,
    required: true,
    min: 0,
  },
  actualSpend: {
    type: Number,
    default: 0,
    min: 0,
  },
  variance: {
    type: Number,
    default: 0,
  },
  utilization: {
    type: Number, // percentage: (actualSpend / budget) * 100
    default: 0,
  },
  status: {
    type: String,
    enum: ["Within Budget", "Over Budget"],
    default: "Within Budget",
  },
  expenses: [
    {
      type:  Schema.Types.ObjectId,
      ref: "Expense",
    },
  ]
  //   inflow: {
  //     type: Number,
  //     default: 0,
  //     min: 0,
  //   },
  //   outflow: {
  //     type: Number,
  //     default: 0,
  //     min: 0,
  //   },
});

const BudgetSchema = new Schema(
  {
    accountant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String, // Format: "2025-06"
      required: true,
    },
    phases: [PhaseSchema],
    monthlyBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default model("Budget", BudgetSchema);
