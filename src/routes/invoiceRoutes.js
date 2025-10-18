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
  authorizeRoles("contractor", "accountant", "owner"),
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
  authorizeRoles("contractor", "accountant", "owner"),
  getCompletedTasksForContractor
);
router.put(
  "/:id/mark-paid",
  authenticate,
  authorizeRoles("accountant", "owner"),
  markInvoiceAsPaid
);
router.put(
  "/:id/accountant-verify",
  authenticate,
  authorizeRoles("accountant", "owner"),
  verifyInvoiceByAccountant
);

router.get(
  "/revenues",
  authenticate,
  authorizeRoles("owner"),
  getMonthlyRevenues
);

export default router;
