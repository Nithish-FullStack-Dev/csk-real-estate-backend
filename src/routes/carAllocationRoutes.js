import express from "express";
import {
  getAllCarAllocations,
  saveCarAllocation,
  updateCarAllocation,
} from "../controller/carAllocationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/saveCar", authenticate, saveCarAllocation);
router.get("/getAllCars", authenticate, getAllCarAllocations);
router.put("/updateCarById/:id", authenticate, updateCarAllocation);

export default router;
