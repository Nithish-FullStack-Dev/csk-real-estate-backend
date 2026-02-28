import mongoose, { Types } from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    // Basic party & project details
    partyName: {
      type: String,
      required: [true, "Party name is required"],
      trim: true,
      minlength: 2,
    },

    companyName: {
      type: String,
      trim: true,
    },

    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: [true, "Project name is required"],
      trim: true,
    },

    agent: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },

    propertyDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    paymentPlan: {
      type: String,
      required: [true, "Payment plan is required"],
      enum: ["Full Payment", "Installments", "Construction Linked", "Other"],
    },

    registrationStatus: {
      type: String,
      required: true,
      enum: ["Registered", "Not Registered", "Under Process"],
      default: "Not Registered",
    },

    // Financials
    totalSaleConsideration: {
      type: Number,
      required: [true, "Total sale consideration is required"],
      min: 0,
    },

    advance: {
      type: Number,
      default: 0,
      min: 0,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPaymentDate: {
      type: Date,
    },

    nextPaymentDate: {
      type: Date,
    },

    paymentDetails: {
      type: String,
      trim: true,
      maxlength: 1500,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

PurchaseSchema.pre("save", function (next) {
  this.balance = this.totalSaleConsideration - this.advance;
  next();
});

export const Purchase = mongoose.model("Purchase", PurchaseSchema);
