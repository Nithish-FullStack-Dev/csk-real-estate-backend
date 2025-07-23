import Budget from "../modals/budget.js";
import Invoice from "../modals/invoice.js";
import Expense from "../modals/expense.js";

export const getBudgetsByAccountant = async (req, res) => {
  try {
    const accountantId = req.user._id;
    const month = new Date().toISOString().slice(0, 7); // "2025-06"

    const budgets = await Budget.find({ accountant: accountantId,month });

    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ message: "No budgets found for this user." });
    }

    res.status(200).json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Server error while fetching budgets." });
  }
};

export const createBudget = async (req, res) => {
  try {
    const accountantId = req.user._id;
    const { phases, monthlyBudget } = req.body;

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const existingBudget = await Budget.findOne({ accountant: accountantId, month: currentMonth });

    if (existingBudget) {
      // ✅ Only update planned budgets (don't touch spending data)
      existingBudget.monthlyBudget = monthlyBudget;

      // Update each phase's planned budget while keeping other values intact
      phases.forEach((updatedPhase) => {
        const existingPhase = existingBudget.phases.find(
          (p) => p.name.toLowerCase() === updatedPhase.name.toLowerCase()
        );
        if (existingPhase) {
          existingPhase.budget = updatedPhase.budget;
        }
      });

      const updated = await existingBudget.save();
      return res.status(200).json({ message: "Budget updated safely", budget: updated });
    }

    // ✅ Create new budget if not found
    const enrichedPhases = phases.map((phase) => ({
      ...phase,
      actualSpend: 0,
      variance: 0,
      utilization: 0,
      status: "Within Budget",
      expenses: [], // optional
    }));

    const newBudget = new Budget({
      accountant: accountantId,
      month: currentMonth,
      phases: enrichedPhases,
      monthlyBudget,
    });

    const saved = await newBudget.save();
    res.status(201).json({ message: "Budget created", budget: saved });

  } catch (error) {
    console.error("Error saving budget:", error);
    res.status(500).json({ message: "Failed to create or update budget" });
  }
};

export const getMonthlyCashFlow = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get first and last date of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          status: "paid",
          paymentDate: { $gte: firstDay, $lte: lastDay },
          user: userId, // optional: restrict to this accountant’s invoices
        },
      },
      {
        $group: {
          _id: null,
          inflow: {
            $sum: {
              $cond: [{ $eq: ["$createdBy", "accountant"] }, "$total", 0],
            },
          },
          outflow: {
            $sum: {
              $cond: [{ $eq: ["$createdBy", "contractor"] }, "$total", 0],
            },
          },
        },
      },
      {
        $project: {
          month: {
            $dateToString: { format: "%Y-%m", date: firstDay },
          },
          inflow: 1,
          outflow: 1,
          net: { $subtract: ["$inflow", "$outflow"] },
          _id: 0,
        },
      },
    ];

    const cashFlowData = await Invoice.aggregate(pipeline);
    res.status(200).json(cashFlowData);
  } catch (error) {
    console.error("Failed to compute monthly cash flow:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const addExpenseToPhase = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, amount, expenseName, date, description, proof } = req.body;

    const month = new Date().toISOString().slice(0, 7);

    const budget = await Budget.findOne({ accountant: userId, month });

    if (!budget) {
      return res.status(404).json({ message: "No budget found for this month." });
    }

    const phase = budget.phases.find(
      (p) => p.name.toLowerCase() === category.toLowerCase()
    );

    if (!phase) {
      return res.status(400).json({ message: "Invalid category/phase" });
    }

    // ✅ Create Expense Document
    const expenseDoc = await Expense.create({
      accountant: userId,
      expenseName,
      category,
      amount: Number(amount),
      date: new Date(date),
      description,
      proof,
    });

    // ✅ Push only ObjectId
    if (!Array.isArray(phase.expenses)) {
      phase.expenses = [];
    }
    phase.expenses.push(expenseDoc._id); // ✅ Not the full object!

    // ✅ Update budget calculations
    phase.actualSpend += Number(amount);
    phase.variance = phase.actualSpend - phase.budget;
    phase.utilization = (phase.actualSpend / phase.budget) * 100;
    phase.status = phase.actualSpend > phase.budget ? "Over Budget" : "Within Budget";

    await budget.save();

    res.status(200).json({ message: "Expense added", expense: expenseDoc });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getAllExpenses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Optional: Filter only for this user's budget categories
    const expenses = await Expense.find({accountant: userId})
      .sort({ createdAt: -1 }) // latest first
      .limit(100); // or as needed

    res.status(200).json(expenses);
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}