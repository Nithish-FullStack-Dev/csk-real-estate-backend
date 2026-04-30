import express from "express";
import {
  getAccountantPayments,
  createPayment,
} from "../controller/paymentsController.js";

import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/accountant", authenticate, getAccountantPayments);

router.post("/", authenticate, createPayment);

export default router;
