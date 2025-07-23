import express from "express";
import {
  createOpenPlot,
  deleteOpenPlotById,
  getAllOpenPlot,
  getOpenPlotById,
  updateOpenPlot,
} from "../controller/openPlotController.js";

const router = express.Router();

router.post("/saveOpenPlot", createOpenPlot);
router.get("/getAllOpenPlot", getAllOpenPlot);
router.get("/getOpenPlotById/:id", getOpenPlotById);
router.delete("/deleteOpenPlot/:id", deleteOpenPlotById);
router.put("/updateOpenPlot/:id", updateOpenPlot);

export default router;
