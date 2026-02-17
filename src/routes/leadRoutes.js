import express from "express";
import {
  createOpenLandLead,
  createOpenPlotLead,
  deleteLeadById,
  getAllLeads,
  getAvailableProperties,
  getClosedLeads,
  getLeadsByOpenLandId,
  getLeadsByOpenPlotId,
  getLeadsByUnitId,
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
router.get("/getLeadProp", authenticate, getAvailableProperties);
router.get("/getLeadsByUnitId/:_id", authenticate, getLeadsByUnitId);
router.get("/getLeadsByOpenPlotId/:_id", authenticate, getLeadsByOpenPlotId);
router.get("/getLeadsByOpenLandId/:_id", authenticate, getLeadsByOpenLandId);
router.put("/updateLead/:id", authenticate, updateLeadById);
router.delete("/deleteLead/:id", authenticate, deleteLeadById);

router.post("/open-plot", authenticate, createOpenPlotLead);
router.post("/open-land", authenticate, createOpenLandLead);

export default router;
