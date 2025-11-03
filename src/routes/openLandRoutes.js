import express from "express";
import {
  createOpenLand,
  deleteOpenLandById,
  getAllOpenLand,
  getOpenLandById,
  updateOpenLand,
} from "../controller/openLandController.js";

const router = express.Router();

router.post("/saveOpenLand", createOpenLand);
router.get("/getAllOpenLand", getAllOpenLand);
router.get("/getOpenLandById/:id", getOpenLandById);
router.delete("/deleteOpenLand/:id", deleteOpenLandById);
router.put("/updateOpenLand/:id", updateOpenLand);

export default router;
