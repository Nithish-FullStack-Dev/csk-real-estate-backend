import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

// ========== Sub-schema for GST (GSTR-1, GSTR-3B) ==========
const GstDocumentSchema = new Schema({
  type: { type: String, enum: ["gstr1", "gstr3b"], required: true },
  period: { type: String, required: true }, // e.g., "May 2024"
  amount: { type: Number, required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ["pending", "filed"], default: "pending" },
  documentUrl: { type: String },
  auditorName: { type: String },
  isApprovedByAuditor: { type: Boolean, default: false },
  auditStatus: {type:String}
});

// ========== Sub-schema for TDS ==========
const TdsDocumentSchema = new Schema({
  quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], required: true },
  section: { type: String }, // e.g., "194C"
  amountDeducted: { type: Number },
  challanNumber: { type: String },
  paymentDate: { type: Date },
  status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  documentUrl: { type: String },
  auditorName: { type: String },
  isApprovedByAuditor: { type: Boolean, default: false },
  auditStatus: {type:String}
});

// ========== Sub-schema for ITR ==========
const ItrDocumentSchema = new Schema({
  financialYear: { type: String, required: true }, // e.g., "2023-24"
  type:{type: String},
  filingDate: { type: Date },
  amount: { type: Number },
  status: { type: String, enum: ["filed", "pending"], default: "pending" },
  documentUrl: { type: String },
});

// ========== Sub-schema for Form 16 ==========
const Form16DocumentSchema = new Schema({
  financialYear: { type: String, required: true },
  issueDate: { type: Date },
  amount: { type: Number },
  documentUrl: { type: String },
});


// ========== Parent Tax Document Schema ==========
const TaxDocumentSchema = new Schema({
  accountantId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  gstDocuments: [GstDocumentSchema],
  tdsDocuments: [TdsDocumentSchema],
  itrDocuments: [ItrDocumentSchema],
  form16Documents: [Form16DocumentSchema],
}, {
  timestamps: true,
});

export default model("TaxDocument", TaxDocumentSchema);
