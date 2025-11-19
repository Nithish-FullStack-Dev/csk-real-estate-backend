import express from "express";
import {
  deleteLeadById,
  getAllLeads,
  getAvailableProperties,
  getClosedLeads,
  getLeadsByOpenLandId,
  getLeadsByOpenPlotId,
  getLeadsByUserId,
  saveLead,
  updateLeadById,
} from "../controller/leadController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/saveLead", authenticate, saveLead);
router.get("/getAllLeads", authenticate, getAllLeads);
router.get("/getClosedLeads", authenticate, getClosedLeads);
router.get("/getLeadsById", authenticate, getLeadsByUserId);
router.get("/getLeadProp", getAvailableProperties);
router.get("/getLeadsByUserId/:_id", authenticate, getLeadsByUserId);
router.get("/getLeadsByOpenPlotId/:_id", authenticate, getLeadsByOpenPlotId);
router.get("/getLeadsByOpenLandId/:_id", authenticate, getLeadsByOpenLandId);
router.put("/updateLead/:id", authenticate, updateLeadById);
router.delete("/deleteLead/:id", authenticate, deleteLeadById);

export default router;
