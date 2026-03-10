import mongoose from "mongoose";
import Payment from "../modals/payment.js";
import Invoice from "../modals/invoice.js";

export const getAccountantPayments = async (req, res) => {
  try {
    const accountantId = req.user._id;

    // Fetch all payments created by this accountant
    const payments = await Payment.find({
      accountant: accountantId,
      isDeleted: false,
    })
      .populate({
        path: "invoice",
        match: { isDeleted: false },
        populate: [
          {
            path: "project", // from Invoice
            model: "Building",
            select: "projectName", // get project name
          },
          {
            path: "unit", // populate the PropertyUnit reference
            model: "PropertyUnit",
            select: "plotNo propertyType",
          },
          {
            path: "floorUnit", // populate the FloorUnit reference
            model: "FloorUnit",
            select: "floorNumber",
          },
        ],
      })

      .populate({
        path: "accountant",
        model: "User",
        select: "name email role",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const accountantId = req.user._id;

    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      nextPaymentDate,
      note,
    } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    if (paymentAmount > invoice.remainingAmount) {
      return res.status(400).json({
        message: `Payment exceeds remaining balance (${invoice.remainingAmount})`,
      });
    }

    // 🔹 Generate payment number BEFORE save
    const shortId = new mongoose.Types.ObjectId().toString().slice(-6);
    const year = new Date().getFullYear();
    const paymentNumber = `PAY-${year}-${shortId.toUpperCase()}`;

    const payment = new Payment({
      accountant: accountantId,
      invoice: invoiceId,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      nextPaymentDate,
      note,
      paymentNumber,
      createdBy: req.user._id,
    });

    await payment.save();

    // 🔹 Update invoice
    invoice.paidAmount += paymentAmount;
    invoice.remainingAmount = invoice.total - invoice.paidAmount;

    if (invoice.remainingAmount === 0) {
      invoice.status = "paid";
      invoice.paymentDate = new Date();
    } else {
      invoice.status = "partially_paid";
    }

    invoice.updatedBy = req.user._id;

    await invoice.save();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
      invoiceSummary: {
        total: invoice.total,
        paid: invoice.paidAmount,
        remaining: invoice.remainingAmount,
        status: invoice.status,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
