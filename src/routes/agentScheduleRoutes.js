import express from "express";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controller/agentScheduleContoller.js";

const router = express.Router();

router.get("/getSchedules", getAppointments);
router.post("/addSchedules", createAppointment);
router.put("/updateSchedules/:id", updateAppointment);
router.delete("/deleteSchedules/:id", deleteAppointment);

export default router;
