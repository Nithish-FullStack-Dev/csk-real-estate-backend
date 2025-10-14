import express from "express";
import {
  createUserSchedule,
  getBuildingNameForDropDown,
  getUnitsNameForDropDown,
  getUserSchedules,
  updateSchedule,
} from "../controller/userScheduleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/schedule", authenticate, createUserSchedule);
router.get("/schedules", authenticate, getUserSchedules);
router.get(
  "/getBuildingNameForDropDown",
  authenticate,
  getBuildingNameForDropDown
);
router.get("/getUnitsNameForDropDown", authenticate, getUnitsNameForDropDown);
router.put("/schedule/:id", updateSchedule);

export default router;
