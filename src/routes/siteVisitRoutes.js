import express from "express";
import {
  createSiteVisit,
  getAllSiteVisits,
  getSiteVisitById,
  updateSiteVisit,
  deleteSiteVisit,
  getSiteVisitOfAgents,
  approvalOrRejectStatus,
  getMyTeamSiteVisits,
  updateVisitStatus,
  getPendingSiteVisitsForAgent,
  getApprovedSiteVisitsForAgent,
  getRejectedSiteVisitsForAgent,
} from "../controller/siteVisitController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/getMyTeamSiteVisits", authenticate, getMyTeamSiteVisits);
router.post("/bookSite", authenticate, createSiteVisit);
router.get("/getAllSiteVis", authenticate, getAllSiteVisits);
router.get("/getSiteVisitById/:bookedBy", authenticate, getSiteVisitById);
router.get("/getSiteVisitOfAgents", authenticate, getSiteVisitOfAgents);
router.patch("/approvalOrReject", authenticate, approvalOrRejectStatus);
router.put("/updateSite/:id", authenticate, updateSiteVisit);
router.delete("/deleteSite/:id", authenticate, deleteSiteVisit);
router.patch("/updateVisitStatus", authenticate, updateVisitStatus);
router.get(
  "/getPendingSiteVisitsForAgent",
  authenticate,
  getPendingSiteVisitsForAgent,
);
router.get(
  "/getApprovedSiteVisitsForAgent",
  authenticate,
  getApprovedSiteVisitsForAgent,
);
router.get(
  "/getRejectedSiteVisitsForAgent",
  authenticate,
  getRejectedSiteVisitsForAgent,
);

export default router;
