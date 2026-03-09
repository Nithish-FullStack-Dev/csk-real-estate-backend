import express from "express";
import {
  getAllExpenses,
  updateExpenseStatusByOwner,
} from "../controller/expenseControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAllExpenses);
router.put("/:id/owner-approval", authenticate, updateExpenseStatusByOwner);

export default router;
