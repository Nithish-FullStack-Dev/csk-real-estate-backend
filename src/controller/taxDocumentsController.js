import mongoose from "mongoose";
import TaxDocument from "../modals/taxDocuments.js";

export const addDocument = async (req, res) => {
  const accountantId = req.user._id;
  const { type, data } = req.body;

  if (!accountantId || !type || !data)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    // Find or create tax document record for the accountant
    let taxDoc = await TaxDocument.findOne({ accountantId, isDeleted: false });

    if (!taxDoc) {
      taxDoc = new TaxDocument({
        accountantId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        isDeleted: false,
      });
    } else {
      taxDoc.updatedBy = req.user._id;
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
        if (!data.type) {
          data.type = "ITR";
        }
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
        if (!data.type) {
          data.type = "Form16";
        }
        const exists = taxDoc.form16Documents.some(
          (doc) => doc.financialYear === data.financialYear,
        );

        if (exists) {
          return res.status(400).json({
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
    let query = {};

    const user = req.user._id;
    const role = req.user.role;

    if (role === "accountant") {
      query.accountantId = user;
    } else {
      query.accountantId = null;
    }

    const taxDocs = await TaxDocument.findOne({
      ...query,
      isDeleted: false,
    }).lean();

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

  try {
    const update = {
      updatedBy: req.user._id,
    };

    // try GST
    let result = await TaxDocument.findOneAndUpdate(
      {
        isDeleted: false,
        "gstDocuments._id": docId,
      },
      {
        $set: {
          "gstDocuments.$.status": status.toLowerCase(),
          "gstDocuments.$.auditorName": auditorName,
          "gstDocuments.$.auditType": "GST Audit",
          "gstDocuments.$.auditStatus": "In Progress",
          updatedBy: req.user._id,
        },
      },
      { new: true },
    );

    // try TDS
    if (!result) {
      result = await TaxDocument.findOneAndUpdate(
        {
          isDeleted: false,
          "tdsDocuments._id": docId,
        },
        {
          $set: {
            "tdsDocuments.$.status": status.toLowerCase(),
            "tdsDocuments.$.auditorName": auditorName,
            "tdsDocuments.$.auditType": "TDS Audit",
            "tdsDocuments.$.auditStatus": "In Progress",
            updatedBy: req.user._id,
          },
        },
        { new: true },
      );
    }

    // try ITR
    if (!result) {
      result = await TaxDocument.findOneAndUpdate(
        {
          isDeleted: false,
          "itrDocuments._id": docId,
        },
        {
          $set: {
            "itrDocuments.$.status": status.toLowerCase(),
            "itrDocuments.$.auditorName": auditorName,
            "itrDocuments.$.auditType": "Tax Audit",
            updatedBy: req.user._id,
          },
        },
        { new: true },
      );
    }

    if (!result) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

export const updateAuditStatus = async (req, res) => {
  const { docId } = req.params;
  const { auditStatus, type } = req.body;

  try {
    let result = null;

    if (type === "gstr1" || type === "gstr3b") {
      result = await TaxDocument.findOneAndUpdate(
        {
          isDeleted: false,
          accountantId: req.user._id,
          "gstDocuments._id": docId,
        },
        {
          $set: {
            "gstDocuments.$.auditStatus": auditStatus,
            updatedBy: req.user._id,
          },
        },
        { new: true },
      );
    }

    if (type === "itr") {
      result = await TaxDocument.findOneAndUpdate(
        {
          isDeleted: false,
          accountantId: req.user._id,
          "itrDocuments._id": docId,
        },
        {
          $set: {
            "itrDocuments.$.auditStatus": auditStatus,
            updatedBy: req.user._id,
          },
        },
        { new: true },
      );
    }

    if (!result) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Audit status updated" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};
