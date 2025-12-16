import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controller/cashexpenses.controller.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/addCashExp", upload.single("proofBill"), createTransaction);
router.get("/getAllCashExp", getAllTransactions);
router.get("/getCashExpById/:id", getTransactionById);
router.put("/updateCashExp/:id", upload.single("proofBill"), updateTransaction);
router.delete("/deleteCashExp/:id", deleteTransaction);

export default router;
