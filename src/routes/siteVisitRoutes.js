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

export default router;
