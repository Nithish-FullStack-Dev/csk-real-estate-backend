import Expense from "../modals/expense.js"; // Adjust path if needed
import { createNotification } from "../utils/notificationHelper.js";

// GET /api/expenses
export const getAllExpenses = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "accountant") {
      query.accountant = req.user._id;
    }

    const expenses = await Expense.find(query)
      .populate("accountant", "name email") // Optional: populate accountant details
      .sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PUT /api/expenses/:id/owner-approval
export const updateExpenseStatusByOwner = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      {
        status,
        isApprovedByOwner: status === "Approved",
        description: notes || "",
      },
      { new: true },
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // 🔔 Notify submitter when expense approved/rejected
    if (["Approved", "Rejected"].includes(status)) {
      await createNotification({
        userId: updatedExpense.createdBy, // <-- submitter
        title: "Expense Status Updated",
        message: `Your expense request has been ${status}.`,
        triggeredBy: req.user._id,
      });
    }

    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};
