import express from "express";
import { createLaborTeam,getLaborTeamsForContractor, recordAttendance } from "../controller/labourTeamControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createLaborTeam);
router.get("/", authenticate, getLaborTeamsForContractor);
router.post("/:id/attendance",authenticate,recordAttendance);

export default router;
