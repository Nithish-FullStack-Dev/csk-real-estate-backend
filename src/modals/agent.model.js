import mongoose, { Schema, model, Types } from "mongoose";

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
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

AgentSchema.index(
  { panCard: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

AgentSchema.index(
  { aadharCard: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

AgentSchema.index(
  { accountNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

const AgentCommissionModel = model("AgentCommission", AgentSchema);

export default AgentCommissionModel;
