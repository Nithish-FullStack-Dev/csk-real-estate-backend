import express from "express";
import {
  createQualityIssue,
  getQualityIssuesByUserId,
  updateIssue,
  updateStatus,
} from "../controller/qualityIssueControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post(
  "/create-quality-issue",
  upload.fields([{ name: "evidenceImages", maxCount: 10 }]),
  authenticate,
  createQualityIssue,
);
router.get("/issues", authenticate, getQualityIssuesByUserId);
router.post("/issue", authenticate, updateIssue);
router.patch("/issues/:id/status", authenticate, updateStatus);

export default router;
