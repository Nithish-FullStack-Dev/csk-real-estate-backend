import express from "express";
import {
  createInvoice,
  getCompletedTasksForContractor,
  getAllInvoices,
  markInvoiceAsPaid,
  verifyInvoiceByAccountant,
  getMonthlyRevenues,
  updateInvoice,
} from "../controller/invoiceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createInvoice);
router.get("/", authenticate, getAllInvoices);
router.get("/completed/tasks", authenticate, getCompletedTasksForContractor);
router.put("/:id/mark-paid", authenticate, markInvoiceAsPaid);
router.put("/:id/accountant-verify", authenticate, verifyInvoiceByAccountant);

router.get("/revenues", authenticate, getMonthlyRevenues);
router.put("/:id", authenticate, updateInvoice);

export default router;
