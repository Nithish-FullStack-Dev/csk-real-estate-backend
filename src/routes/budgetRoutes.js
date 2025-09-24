import express from "express";
import {
  getBudgetsByAccountant,
  createBudget,
  getMonthlyCashFlow,
  addExpenseToPhase,
  getAllExpenses,
  getMonthlyRevenues,
  getQuarterlyTargets,
} from "../controller/budgetController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("accountant"),
  getBudgetsByAccountant
);
router.post(
  "/add",
  authenticate,
  authorizeRoles("accountant", "owner"),
  createBudget
);
router.get(
  "/cashflow",
  authenticate,
  authorizeRoles("accountant", "owner"),
  getMonthlyCashFlow
);
router.post(
  "/expense",
  authenticate,
  authorizeRoles("accountant", "owner"),
  addExpenseToPhase
);
router.get(
  "/expenses/all",
  authenticate,
  authorizeRoles("accountant", "owner"),
  getAllExpenses
);
router.get(
  "/revenues",
  authenticate,
  authorizeRoles("owner"),
  getMonthlyRevenues
);

router.get(
  "/targets",
  authenticate,
  authorizeRoles("owner"),
  getQuarterlyTargets
);

export default router;
