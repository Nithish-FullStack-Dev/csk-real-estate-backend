import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createOpenPlot,
  updateOpenPlot,
  getOpenPlotById,
  deleteOpenPlot,
  getAllOpenPlots,
  getOpenPlotDropdown,
  getAllOpenPlotsForPublic,
} from "../controller/openPlotController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "brochureUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.post("/saveOpenplot", authenticate, uploadFields, createOpenPlot);
router.put("/updateOpenplot/:_id", authenticate, uploadFields, updateOpenPlot);
router.get("/getAllOpenPlot", authenticate, getAllOpenPlots);
router.get("/getAllOpenPlotForPublic", getAllOpenPlotsForPublic);
router.get("/getOpenplot/:_id", getOpenPlotById);
router.delete("/deleteOpenplot/:_id", authenticate, deleteOpenPlot);

router.get("/getOpenPlotDropdown", authenticate, getOpenPlotDropdown);

export default router;
