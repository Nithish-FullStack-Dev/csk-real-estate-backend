import express from "express";
import {
  deleteLeadById,
  getAllLeads,
  getAvailableProperties,
  getClosedLeads,
  getLeadsByUserId,
  saveLead,
  updateLeadById,
} from "../controller/leadController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/saveLead", authenticate, saveLead);
router.get("/getAllLeads", authenticate, getAllLeads);
router.get("/getClosedLeads", getClosedLeads);
router.get("/getLeadsById", authenticate, getLeadsByUserId);
router.get("/getLeadProp", getAvailableProperties);
router.put("/updateLead/:id", authenticate, updateLeadById);
router.delete("/deleteLead/:id", authenticate, deleteLeadById);

export default router;
