import { populate } from "dotenv";
import Payment from "../modals/payment.js";

export const getAccountantPayments = async (req, res) => {
  try {
    const accountantId = req.user._id;

    // Fetch all payments created by this accountant
    const payments = await Payment.find({ accountant: accountantId })
      .populate({
        path: "invoice",
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
