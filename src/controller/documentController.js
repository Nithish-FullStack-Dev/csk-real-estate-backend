import Document from "../modals/Document.js";
import fs from "fs";
import path from "path";
<<<<<<< HEAD

=======
import { uploadOnCloudniary } from "../config/cloudinary.js";
import { createNotification } from "../utils/notificationHelper.js";

//! CREATE Document
// export const uploadDocument = async (req, res) => {
//   try {
//     const file = req.file;
//     const { docName, docType, docOfUser, uploadedBy, description, property } =
//       req.body;

//     if (!file || !docName || !docType || !docOfUser || !uploadedBy) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // ⬆️ Upload to Cloudinary
//     const cloudinaryUrl = await uploadOnCloudniary(file.path);
//     if (!cloudinaryUrl) {
//       return res.status(500).json({ message: "Cloud upload failed" });
//     }

//     const newDoc = new Document({
//       docName,
//       docType,
//       docOfUser,
//       uploadedBy,
//       description,
//       format: file.mimetype.split("/")[1]?.toUpperCase(),
//       size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
//       filePath: cloudinaryUrl, // ✅ Cloudinary secure URL
//       property,
//     });

//     await newDoc.save();
//     res
//       .status(201)
//       .json({ message: "Document uploaded successfully", data: newDoc });
//   } catch (error) {
//     res.status(500).json({ message: "Upload failed", error: error.message });
//   }
// };

>>>>>>> affd563 (feat: Enhance notification system across controllers)
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;

    const { docName, docType, docOfUser, uploadedBy, description, property } =
      req.body;

    if (!file || !docName || !docType || !docOfUser || !uploadedBy) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const filePath = file.path.replace(/\\/g, "/");

    const newDoc = new Document({
      docName,
      docType,
      docOfUser,
      uploadedBy,
      description,
      property,
      format: file.mimetype.split("/")[1]?.toUpperCase(),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      filePath,
    });

    await newDoc.save();

<<<<<<< HEAD
    res.status(201).json({
      message: "Document uploaded successfully",
      data: newDoc,
    });
=======
    // =============================================
    // 🔔 7.2 Documents Uploaded
    // Notify: Purchased Customer + Owner
    // =============================================

    if (property) {
      const propertyDoc = await Property.findById(property)
        .select("customerInfo.customerId");

      const customerId = propertyDoc?.customerInfo?.customerId;

      const owners = await User.find({ role: "owner" }).select("_id");

      const receivers = [
        customerId,
        ...owners.map((u) => u._id),
      ].filter(Boolean);

      if (receivers.length > 0) {
        await createNotification({
          userId: receivers,
          title: "New Document Uploaded",
          message: `A new document (${docName}) has been uploaded.`,
          triggeredBy: req.user._id,
          category: "property",
          priority: "P2",
          deepLink: `/documents/${newDoc._id}`,
          entityType: "Document",
          entityId: newDoc._id,
        });
      }
    }

    res
      .status(201)
      .json({ message: "Document uploaded successfully", data: newDoc });
>>>>>>> affd563 (feat: Enhance notification system across controllers)
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await Document.find()
      .populate("uploadedBy docOfUser")
      .populate("property");

    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching documents",
      error: error.message,
    });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("uploadedBy docOfUser")
      .populate("property");

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching document",
      error: error.message,
    });
  }
};
export const updateDocument = async (req, res) => {
  try {
    const { docName, docType, status, description, property } = req.body;

    const updateFields = {
      docName,
      docType,
      status,
      description,
      property,
    };

    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");

      updateFields.filePath = filePath;
      updateFields.format = req.file.mimetype.split("/")[1]?.toUpperCase();
      updateFields.size = `${(req.file.size / 1024 / 1024).toFixed(2)} MB`;
    }

    const updated = await Document.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      message: "Document updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.deleteOne();

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};
