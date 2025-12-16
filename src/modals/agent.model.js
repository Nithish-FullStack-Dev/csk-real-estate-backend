import { Schema, model, Types } from "mongoose";

const AgentSchema = new Schema(
  {
    agentId: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },

    panCard: {
      type: String,
      trim: true,
    },

    aadharCard: {
      type: String,
      trim: true,
    },

    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },

    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },

    agreedCommissionPercent: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    amountReceived: {
      type: Number,
      default: 0,
    },

    commissionPaid: {
      type: Number,
      default: 0,
    },

    paymentDate: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
    },

    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const AgentCommissionModel = model("AgentCommission", AgentSchema);

export default AgentCommissionModel;
