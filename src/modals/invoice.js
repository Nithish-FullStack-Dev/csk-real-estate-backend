import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: {
    type: String,
    enum: ["Job", "Hours", "Days", "Sq.ft", "Units"],
    required: true,
  },
  rate: { type: Number, required: true },
  taxRate: { type: Number, required: true }, // For item-level tax if needed
  amount: { type: Number, required: true }, // quantity * rate (+ tax if applied)
});

const InvoiceSchema = new Schema(
  {
    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },
    unit:{
      type:String,
      required:true
    },
    invoiceNumber:{
      type:String
    },
    task: {
      type: Types.ObjectId,
      ref: "Task",
      default: null, // optional
    },
    user: {
      type: Types.ObjectId,
      ref: "User", // assuming User model
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: {
      type: [InvoiceItemSchema],
      default: [],
    },
    sgst: {
      type: Number,
      required: true,
      enum: [0, 2.5, 6, 9, 14],
    },
    cgst: {
      type: Number,
      required: true,
      enum: [0, 2.5, 6, 9, 14],
    },
    notes: {
      type: String,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected","paid"],
      default: "pending",
    },
    isApprovedByAccountant: {
      type: Boolean,
      default: false
    },
    noteByAccountant: {
      type: String
    },
    paymentMethod:{
      type: [String]
    },
    paymentDate:{
      type: Date
    },
    createdBy:{
      type: String,
      enum : ["contractor","accountant"],
      required:true
    },
    reconciliationHistory: [
      {
        item : {type: String},
        amount: { type: Number, required: true },
        paidOn: { type: Date, default: Date.now },
        method: { type: String },
        note: { type: String }
      }
    ]
  },
  {
    timestamps: true,
  }
);

export default model("Invoice", InvoiceSchema);
