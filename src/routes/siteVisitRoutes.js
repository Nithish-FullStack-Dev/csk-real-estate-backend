import express from "express";
import {
  createSiteVisit,
  getAllSiteVisits,
  getSiteVisitById,
  updateSiteVisit,
  deleteSiteVisit,
  getSiteVisitOfAgents,
  approvalOrRejectStatus,
} from "../controller/siteVisitController.js";

const router = express.Router();

router.post("/bookSite", createSiteVisit);
router.get("/getAllSiteVis", getAllSiteVisits);
router.get("/getSiteVisitOfAgents", getSiteVisitOfAgents);
router.get("/getSiteVisitById/:bookedBy", getSiteVisitById);
router.patch("/approvalOrReject", approvalOrRejectStatus);
router.put("/updateSite/:id", updateSiteVisit);
router.delete("/deleteSite/:id", deleteSiteVisit);

export default router;
