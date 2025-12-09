import mongoose, { model, Schema } from "mongoose";

const contractorSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    panCardNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    contractorType: {
      type: String,
      enum: ["Individual", "Firm", "Private Ltd", "LLP", "Other"],
      required: true,
    },

    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
    },
    branchName: {
      type: String,
      trim: true,
    },

    contractStartDate: {
      type: Date,
    },
    contractEndDate: {
      type: Date,
    },

    projectsAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],

    siteIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    accountsIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    balancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentDetails: [
      {
        modeOfPayment: {
          type: String,
          enum: ["Cash", "Cheque", "NEFT", "RTGS", "UPI"],
        },
        paymentDate: {
          type: Date,
        },
        lastPaymentDate: {
          type: Date,
        },
      },
    ],

    billInvoiceNumber: {
      type: String,
      trim: true,
    },

    billCopy: {
      type: String,
    },

    workDetails: {
      type: String,
      trim: true,
    },

    billedDate: {
      type: Date,
    },

    billApprovedBySiteIncharge: {
      type: Boolean,
      default: false,
    },

    billProcessedByAccountant: {
      type: Boolean,
      default: false,
    },

    finalPaymentDate: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

contractorSchema.index({ companyName: 1 });
contractorSchema.index({ gstNumber: 1 });
contractorSchema.index({ panCardNumber: 1 });

const Contractor = model("Contractor", contractorSchema);
export default Contractor;
