import express from "express";
import {
  createInvoice,
  getCompletedTasksForContractor,
  getAllInvoices,
  markInvoiceAsPaid,
  verifyInvoiceByAccountant,
  getMonthlyRevenues,
} from "../controller/invoiceController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("contractor", "accountant", "owner", "admin"),
  createInvoice
);
router.get(
  "/",
  authenticate,
  authorizeRoles("contractor", "accountant", "owner", "admin"),
  getAllInvoices
);
router.get(
  "/completed/tasks",
  authenticate,
  authorizeRoles("contractor", "accountant", "owner", "admin"),
  getCompletedTasksForContractor
);
router.put(
  "/:id/mark-paid",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  markInvoiceAsPaid
);
router.put(
  "/:id/accountant-verify",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  verifyInvoiceByAccountant
);

router.get(
  "/revenues",
  authenticate,
  authorizeRoles("owner", "admin"),
  getMonthlyRevenues
);

export default router;
