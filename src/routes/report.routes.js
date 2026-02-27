import express from "express";
import {
  getReportByType,
  agentPerformanceReport,
} from "../controller/report.controller.js";

const router = express.Router();

router.get("/:type", getReportByType);
router.get("/agents", agentPerformanceReport);
export default router;
