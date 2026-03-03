import express from "express";
import { getAuditLogs } from "../controller/audit.controller.js";

const router = express.Router();

router.get("/getAll", getAuditLogs);

export default router;
