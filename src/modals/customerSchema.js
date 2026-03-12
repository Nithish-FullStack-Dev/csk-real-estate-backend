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
      default: null,
    },

    floorUnit: {
      type: Types.ObjectId,
      ref: "FloorUnit",
      default: null,
    },

    unit: {
      type: Types.ObjectId,
      ref: "PropertyUnit",
      default: null,
    },

    openPlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenPlot",
      default: null,
    },
    innerPlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InnerPlot",
      default: null,
    },
    openLand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenLand",
      default: null,
    },

    purchaseType: {
      type: String,
      enum: ["BUILDING", "PLOT", "LAND"],
      required: true,
      index: true,
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
      default: 0,
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
  { timestamps: true },
);

purchaseSchema.index({ property: 1 });
purchaseSchema.index({ openPlot: 1 });
purchaseSchema.index({ openLand: 1 });

purchaseSchema.pre("validate", function (next) {
  if (this.purchaseType === "BUILDING") {
    if (!this.property || !this.floorUnit || !this.unit) {
      return next(
        new Error("Building purchase requires property, floorUnit and unit"),
      );
    }
  }

  if (this.purchaseType === "PLOT") {
    if (!this.openPlot || !this.innerPlot) {
      return next(new Error("Plot purchase requires openPlot or innerPlot"));
    }
  }

  if (this.purchaseType === "LAND") {
    if (!this.openLand) {
      return next(new Error("Land purchase requires openLand"));
    }
  }

  next();
});

purchaseSchema.methods.calculateBalance = function () {
  const total = this.totalAmount || 0;
  const advance = this.advanceReceived || 0;

  const payments =
    this.paymentDetails?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  this.balancePayment = total - advance - payments;
};

export default model("Customer", purchaseSchema);
