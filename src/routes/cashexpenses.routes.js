import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controller/cashexpenses.controller.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/addCashExp",
  authenticate,
  upload.single("proofBill"),
  createTransaction,
);
router.get("/getAllCashExp", authenticate, getAllTransactions);
router.get("/getCashExpById/:id", authenticate, getTransactionById);
router.put(
  "/updateCashExp/:id",
  authenticate,
  upload.single("proofBill"),
  updateTransaction,
);
router.delete("/deleteCashExp/:id", authenticate, deleteTransaction);

export default router;
