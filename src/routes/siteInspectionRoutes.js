import express from "express";
import { createSiteInspection,getInspectionsByIncharge,updateStatus,addPhotosToInspection } from "../controller/siteInspectionControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/inspection/create",authenticate, createSiteInspection);
router.get("/inspections",authenticate, getInspectionsByIncharge);
router.patch("/inspection/:id/status",updateStatus);
router.patch("/add-photos/:id", addPhotosToInspection);

export default router;