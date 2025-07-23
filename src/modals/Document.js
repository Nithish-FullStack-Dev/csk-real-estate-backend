import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    docName: {
      type: String,
      required: true,
      trim: true,
    },
    docType: {
      // e.g., 'sales_agreement', 'id_proof', 'address_proof', 'bank_statement'
      type: String,
      required: true,
    },
    docOfUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["verified", "pending_signature", "requires_update"],
      default: "pending_signature",
    },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    size: {
      // e.g., "2.4 MB"
      type: String,
      required: true,
    },
    format: {
      // e.g., "PDF", "JPEG"
      type: String,
      required: true,
    },
    filePath: {
      // Path to the stored file on the server or cloud storage URL
      type: String,
      required: true,
    },
    uploadedBy: {
      // Reference to the user who uploaded the document
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
