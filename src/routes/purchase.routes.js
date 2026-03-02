import { Router } from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controller/purchase.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/addPurchase", authenticate, createPurchase);
router.get("/getAllPurchase", authenticate, getAllPurchases);
router.get("/getPurchaseById/:id", authenticate, getPurchaseById);
router.put("/updatePurchase/:id", authenticate, updatePurchase);
router.delete("/deletePurchase/:id", authenticate, deletePurchase);

export default router;
