import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const purchaseSchema = new Schema(
  {
    customerId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
      index: true,
    },

    purchasedFrom: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Agent / Purchased From is required"],
      index: true,
    },

    projectCompany: {
      type: String,
      trim: true,
    },

    property: {
      type: Types.ObjectId,
      ref: "Building",
      required: [true, "Property (Building) is required"],
    },

    floorUnit: {
      type: Types.ObjectId,
      ref: "FloorUnit",
      required: [true, "Floor Unit is required"],
    },

    unit: {
      type: Types.ObjectId,
      ref: "PropertyUnit",
      required: [true, "Property Unit is required"],
    },

    // Referral details
    referralName: {
      type: String,
      trim: true,
    },

    referralContact: {
      type: String,
      trim: true,
      minlength: [10, "Referral contact must be at least 10 digits"],
    },

    registrationStatus: {
      type: String,
      enum: ["Booked", "Registered", "Cancelled", "Completed"],
      default: "Booked",
      index: true,
    },

    bookingDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (v) => !isNaN(v),
        message: "Booking date is invalid",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    advanceReceived: {
      type: Number,
      default: 0,
      min: [0, "Advance amount cannot be negative"],
    },

    balancePayment: {
      type: Number,
      default: function () {
        return (this.totalAmount || 0) - (this.advanceReceived || 0);
      },
    },

    lastPaymentDate: {
      type: Date,
      validate: {
        validator: (v) => !v || !isNaN(v),
        message: "Last payment date is invalid",
      },
    },

    paymentPlan: {
      type: String,
      enum: [
        "Down Payment",
        "Monthly EMI",
        "Construction Linked Plan",
        "Custom Plan",
      ],
    },

    paymentDetails: [
      {
        amount: {
          type: Number,
          min: [0, "Payment amount cannot be negative"],
        },
        date: {
          type: Date,
          validate: {
            validator: (v) => !v || !isNaN(v),
            message: "Payment date is invalid",
          },
        },
        paymentMode: { type: String, trim: true },
        referenceNumber: { type: String, trim: true },
        remarks: { type: String, trim: true },
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    contractorId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },

    siteInchargeId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },

    constructionStage: {
      type: String,
      trim: true,
    },

    expectedDeliveryDate: {
      type: Date,
      validate: {
        validator: (v) => !v || !isNaN(v),
        message: "Expected delivery date is invalid",
      },
    },

    deliveryDate: {
      type: Date,
      validate: {
        validator: (v) => !v || !isNaN(v),
        message: "Delivery date is invalid",
      },
    },

    status: {
      type: String,
      enum: ["Active", "Completed", "Delayed", "Cancelled"],
      default: "Active",
      index: true,
    },

    finalPrice: {
      type: Number,
      min: [0, "Final price cannot be negative"],
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      index: true,
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],
    pdfDocument: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default model("Customer", purchaseSchema);
