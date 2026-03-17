import express from "express";
import { getAuditLogs } from "../controller/audit.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/getAll", authenticate, getAuditLogs);

export default router;
