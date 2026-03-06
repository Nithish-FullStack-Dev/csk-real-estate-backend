import mongoose from "mongoose";
import TaxDocument from "../modals/taxDocuments.js";

export const addDocument = async (req, res) => {
  const accountantId = req.user._id;
  const { type, data } = req.body;

  if (!accountantId || !type || !data)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    // Find or create tax document record for the accountant
    let taxDoc = await TaxDocument.findOne({ accountantId });

    if (!taxDoc) {
      taxDoc = new TaxDocument({ accountantId });
    }

    // Add to appropriate array
    switch (type) {
      case "gstr1":
      case "gstr3b": {
        const exists = taxDoc.gstDocuments.some(
          (doc) => doc.type === data.type && doc.period === data.period,
        );

        if (exists) {
          return res
            .status(400)
            .json({ message: "GST return already exists for this period." });
        }

        taxDoc.gstDocuments.push(data);
        break;
      }

      case "tds": {
        const exists = taxDoc.tdsDocuments.some(
          (doc) => doc.quarter === data.quarter && doc.section === data.section,
        );

        if (exists) {
          return res
            .status(400)
            .json({ message: "TDS record already exists for this quarter." });
        }

        taxDoc.tdsDocuments.push(data);
        break;
      }

      case "itr": {
        const exists = taxDoc.itrDocuments.some(
          (doc) => doc.financialYear === data.financialYear,
        );

        if (exists) {
          return res
            .status(400)
            .json({ message: "ITR already exists for this financial year." });
        }

        taxDoc.itrDocuments.push(data);
        break;
      }

      case "form16": {
        const exists = taxDoc.form16Documents.some(
          (doc) => doc.financialYear === data.financialYear,
        );

        if (exists) {
          return res
            .status(400)
            .json({
              message: "Form16 already exists for this financial year.",
            });
        }

        taxDoc.form16Documents.push(data);
        break;
      }

      default:
        return res.status(400).json({ message: "Invalid document type" });
    }

    await taxDoc.save();
    return res.status(201).json({ message: "Document added successfully" });
  } catch (error) {
    console.error("Tax doc save error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const accountantId = req.user._id;

    const taxDocs = await TaxDocument.findOne({ accountantId }).lean();

    return res.status(200).json({
      success: true,
      taxDocuments: taxDocs || {
        gstDocuments: [],
        tdsDocuments: [],
        itrDocuments: [],
        form16Documents: [],
      },
    });
  } catch (error) {
    console.error("Error fetching tax documents:", error);
    return res.status(500).json({
      success: false,
      taxDocuments: {
        gstDocuments: [],
        tdsDocuments: [],
        itrDocuments: [],
        form16Documents: [],
      },
    });
  }
};

export const updateTaxDocStatus = async (req, res) => {
  const { docId } = req.params;
  const { status, auditorName } = req.body;

  if (!mongoose.Types.ObjectId.isValid(docId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  if (!["filed", "pending", "paid", "unpaid"].includes(status?.toLowerCase())) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    let updated = false;

    const taxDoc = await TaxDocument.findOne({
      $or: [
        { "gstDocuments._id": docId },
        { "tdsDocuments._id": docId },
        { "itrDocuments._id": docId },
      ],
    });

    if (!taxDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check GST documents
    for (let gst of taxDoc.gstDocuments) {
      if (gst._id.toString() === docId) {
        gst.status = status.toLowerCase();
        if (status.toLowerCase() === "filed") {
          gst.auditorName = auditorName;
          gst.auditType = "GST Audit";
          gst.auditStatus = "In Progress";
        }
        updated = true;
        break;
      }
    }

    // Check TDS documents
    for (let tds of taxDoc.tdsDocuments) {
      if (tds._id.toString() === docId) {
        tds.status = status.toLowerCase();
        if (status.toLowerCase() === "paid") {
          tds.auditorName = auditorName;
          tds.auditType = "TDS Audit";
          tds.auditStatus = "In Progress";
        }
        updated = true;
        break;
      }
    }

    // Check ITR documents
    for (let itr of taxDoc.itrDocuments) {
      if (itr._id.toString() === docId) {
        itr.status = status.toLowerCase();
        if (status.toLowerCase() === "filed") {
          itr.auditorName = auditorName;
          itr.auditType = "Tax Audit";
        }
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(400).json({ message: "Unable to update status." });
    }

    await taxDoc.save();
    res.status(200).json({ message: "Status updated successfully." });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error while updating status." });
  }
};

export const updateAuditStatus = async (req, res) => {
  const { docId } = req.params;
  const { auditStatus, type } = req.body;

  if (!mongoose.Types.ObjectId.isValid(docId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  if (!["gstr1", "gstr3b", "itr"].includes(type)) {
    return res.status(400).json({ message: "Invalid audit type." });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(docId);

    const taxDoc = await TaxDocument.findOne({
      $or: [{ "gstDocuments._id": objectId }, { "itrDocuments._id": objectId }],
    });

    if (!taxDoc) {
      return res.status(404).json({ message: "Document not found." });
    }

    let updated = false;

    if (type === "gstr1" || type === "gstr3b") {
      for (let gst of taxDoc.gstDocuments) {
        if (gst._id.toString() === docId) {
          gst.auditStatus = auditStatus;
          updated = true;
          break;
        }
      }
    } else if (type === "itr") {
      for (let itr of taxDoc.itrDocuments) {
        if (itr._id.toString() === docId) {
          itr.auditStatus = auditStatus;
          updated = true;
          break;
        }
      }
    }
    if (!updated) {
      return res
        .status(400)
        .json({ message: "Could not update audit status." });
    }

    await taxDoc.save();

    res.status(200).json({ message: "Audit status updated successfully." });
  } catch (error) {
    console.error("Audit update error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
