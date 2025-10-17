import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const customerSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    purchasedFrom: {
      type: Types.ObjectId,
      ref: "User", // Agent
      required: true,
    },

    properties: [
      {
        property: {
          type: Types.ObjectId,
          ref: "Building",
          required: true,
        },
        floorUnit: {
          type: Types.ObjectId,
          ref: "FloorUnit",
          required: true,
        },
        unit: {
          type: Types.ObjectId,
          ref: "PropertyUnit",
          required: true,
        },
        bookingDate: {
          type: Date,
          required: true,
        },
        finalPrice: {
          type: Number,
          required: true,
        },
        paymentPlan: {
          type: String,
          default: "Down Payment",
        },
        paymentStatus: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
          default: "Pending",
        },
        documents: [
          {
            type: Types.ObjectId,
            ref: "Document",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default model("Customer", customerSchema);
