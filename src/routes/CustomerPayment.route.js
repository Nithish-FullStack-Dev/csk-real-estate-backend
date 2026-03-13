import {
  addCustomerPayment,
  deleteCustomerPayment,
  getCustomerLedger,
} from "../controller/customerPayment.controller.js";
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add/:customerId", authenticate, addCustomerPayment);

router.get("/get/:customerId", authenticate, getCustomerLedger);

router.delete("/delete/:paymentId", authenticate, deleteCustomerPayment);

export default router;
