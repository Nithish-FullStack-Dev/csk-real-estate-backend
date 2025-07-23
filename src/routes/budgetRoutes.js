import express from "express";
import { getBudgetsByAccountant,createBudget,getMonthlyCashFlow,addExpenseToPhase,getAllExpenses  } from "../controller/budgetController.js";
import { authenticate, authorizeRoles} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/",authenticate,authorizeRoles("accountant"),getBudgetsByAccountant);
router.post("/add",authenticate,authorizeRoles("accountant"),createBudget);
router.get("/cashflow", authenticate,authorizeRoles("accountant"), getMonthlyCashFlow);
router.post("/expense", authenticate,authorizeRoles("accountant"), addExpenseToPhase);
router.get("/expenses/all",authenticate,authorizeRoles("accountant"),getAllExpenses);

export default router;