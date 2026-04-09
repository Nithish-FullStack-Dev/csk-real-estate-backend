import express from "express";
import {
  createScheduleVisit,
  getAllScheduleVisits,
  updateScheduleVisitStatus,
} from "../controller/ScheduleVisit.controller.js";

const router = express.Router();

router.post("/addScheduleVisit", createScheduleVisit);
router.get("/getAllScheduleVisits", getAllScheduleVisits);
router.put("/updateStatus/:id", updateScheduleVisitStatus);

export default router;
