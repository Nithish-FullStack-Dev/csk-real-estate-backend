import express from "express";
import {
  createCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission,
} from "../controller/commisionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addCommissions", authenticate, createCommission);
router.get("/getAllCommissions", getAllCommissions);
router.get("/getCommissionsById/:id", getCommissionById);
router.put("/updateCommissions/:id", authenticate, updateCommission);
router.delete("/deletedCommissions/:id", authenticate, deleteCommission);

export default router;
