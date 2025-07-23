import Document from "../modals/Document.js"; // adjust path as needed
import fs from "fs";
import path from "path";
import { uploadOnCloudniary } from "../config/cloudinary.js";

//! CREATE Document
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const { docName, docType, docOfUser, uploadedBy, description, property } =
      req.body;

    if (!file || !docName || !docType || !docOfUser || !uploadedBy) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ⬆️ Upload to Cloudinary
    const cloudinaryUrl = await uploadOnCloudniary(file.path);
    if (!cloudinaryUrl) {
      return res.status(500).json({ message: "Cloud upload failed" });
    }

    const newDoc = new Document({
      docName,
      docType,
      docOfUser,
      uploadedBy,
      description,
      format: file.mimetype.split("/")[1]?.toUpperCase(),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      filePath: cloudinaryUrl, // ✅ Cloudinary secure URL
      property,
    });

    await newDoc.save();
    res
      .status(201)
      .json({ message: "Document uploaded successfully", data: newDoc });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

//! GET All Documents
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await Document.find()
      .populate("uploadedBy docOfUser")
      .populate("property");
    res.status(200).json(docs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching documents", error: error.message });
  }
};

//! GET Single Document
export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("uploadedBy docOfUser")
      .populate("property");
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.status(200).json(doc);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching document", error: error.message });
  }
};

//! UPDATE Document Metadata
export const updateDocument = async (req, res) => {
  try {
    const updated = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Document not found" });

    res.status(200).json({ message: "Document updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

//! DELETE Document
export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.deleteOne();
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};
