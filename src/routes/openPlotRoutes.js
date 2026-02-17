import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createOpenPlot,
  updateOpenPlot,
  // getAllOpenPlots,
  getOpenPlotById,
  deleteOpenPlot,
  getAllOpenPlots,
  getOpenPlotDropdown,
} from "../controller/openPlotController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

/* ---------------- MULTER CONFIG ---------------- */
const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "brochureUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

/* ---------------- OPEN PLOT ROUTES ---------------- */
router.post("/saveOpenplot", uploadFields, createOpenPlot);
router.put("/updateOpenplot/:_id", uploadFields, updateOpenPlot);
router.get("/getAllOpenPlot", getAllOpenPlots);
router.get("/getOpenplot/:_id", getOpenPlotById);
router.delete("/deleteOpenplot/:_id", deleteOpenPlot);

router.get("/getOpenPlotDropdown", authenticate, getOpenPlotDropdown);

export default router;
