import express from "express";
import {
  getAccountantPayments,
  createPayment,
} from "../controller/paymentsController.js";

import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/accountant",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  getAccountantPayments,
);

router.post(
  "/",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  createPayment,
);

export default router;
