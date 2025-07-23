import express from "express";
import { getAllExpenses,updateExpenseStatusByOwner } from "../controller/expenseControllers.js";

const router = express.Router();

router.get("/", getAllExpenses);
router.put('/:id/owner-approval', updateExpenseStatusByOwner);


export default router;
