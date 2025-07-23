import express from "express";
import { createQualityIssue,getQualityIssuesByUserId,updateIssue,updateStatus } from "../controller/qualityIssueControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-quality-issue", authenticate,createQualityIssue);
router.get("/issues",authenticate, getQualityIssuesByUserId);
router.post("/issue",authenticate,updateIssue);
router.patch("/issues/:id/status",updateStatus);

export default router;