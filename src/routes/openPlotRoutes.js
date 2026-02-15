import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createOpenPlot,
  updateOpenPlot,
  // getAllOpenPlots,
  getOpenPlotById,
  deleteOpenPlot,
  getAllOpenPlots,
} from "../controller/openPlotController.js";

const router = Router();

/* ---------------- MULTER CONFIG ---------------- */
const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

/* ---------------- OPEN PLOT ROUTES ---------------- */

/**
 * Create Open Plot
 * POST /api/open-plots
 */
router.post("/saveOpenplot", uploadFields, createOpenPlot);

/**
 * Update Open Plot
 * PUT /api/open-plots/:_id
 */
router.put("/updateOpenplot/:_id", uploadFields, updateOpenPlot);

/**
 * Get All Open Plots (with pagination & search)
 * GET /api/open-plots
 */
router.get("/getAllOpenPlot", getAllOpenPlots);

/**
 * Get Open Plot By ID
 * GET /api/open-plots/:_id
 */
router.get("/getOpenplot/:_id", getOpenPlotById);

/**
 * Delete Open Plot
 * DELETE /api/open-plots/:_id
 */
router.delete("/deleteOpenplot/:_id", deleteOpenPlot);

export default router;
