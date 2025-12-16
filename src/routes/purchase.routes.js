import { Router } from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controller/purchase.controller.js";

const router = Router();

router.post("/addPurchase", createPurchase);
router.get("/getAllPurchase", getAllPurchases);
router.get("/getPurchaseById/:id", getPurchaseById);
router.put("/updatePurchase/:id", updatePurchase);
router.delete("/deletePurchase/:id", deletePurchase);

export default router;
