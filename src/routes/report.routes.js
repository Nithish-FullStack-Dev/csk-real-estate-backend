import express from "express";
import { getReportByType } from "../controller/report.controller.js";

const router = express.Router();

router.get("/:type", getReportByType);

export default router;
