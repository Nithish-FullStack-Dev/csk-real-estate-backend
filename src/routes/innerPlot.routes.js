// src/routes/innerPlot.routes.js
import { Router } from "express";
import multer from "multer";
import { upload } from "../middlewares/multer.js";

import {
  createInnerPlot,
  updateInnerPlot,
  deleteInnerPlot,
  getAllInnerPlot,
  getInnerPlotById,
  getInnerPlotDropdown,
} from "../controller/innerPlot.controller.js";

import {
  generateBulkInnerPlots,
  bulkCsvInnerPlots,
} from "../controller/innerPlotBulk.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
const csvUpload = multer({ storage: multer.memoryStorage() });

router.post("/saveInnerPlot", authenticate, uploadFields, createInnerPlot);
router.get("/by-openplot/:_id", authenticate, getInnerPlotById);
router.get("/getAllInnerPlot/:openPlotId", authenticate, getAllInnerPlot);
router.put(
  "/updateInnerPlot/:_id",
  authenticate,
  uploadFields,
  updateInnerPlot,
);
router.delete("/deleteInnerPlot/:_id", authenticate, deleteInnerPlot);
router.post("/generate-bulk", authenticate, generateBulkInnerPlots);
router.post(
  "/csv-upload",
  authenticate,
  csvUpload.single("file"),
  bulkCsvInnerPlots,
);

router.get(
  "/getInnerPlotDropdown/:openPlotId",
  authenticate,
  getInnerPlotDropdown,
);

export default router;
