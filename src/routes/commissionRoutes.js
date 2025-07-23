import express from "express";
import {
  createCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission,
} from "../controller/commisionController.js";

const router = express.Router();

router.post("/addCommissions", createCommission);
router.get("/getAllCommissions", getAllCommissions);
router.get("/getCommissionsById/:id", getCommissionById);
router.put("/updateCommissions/:id", updateCommission);
router.delete("/deletedCommissions/:id", deleteCommission);

export default router;
