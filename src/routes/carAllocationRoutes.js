import express from "express";
import {
  getAllCarAllocations,
  saveCarAllocation,
  updateCarAllocation,
} from "../controller/carAllocationController.js";

const router = express.Router();

router.post("/saveCar", saveCarAllocation);
router.get("/getAllCars", getAllCarAllocations);
router.put("/updateCarById/:id", updateCarAllocation);

export default router;
