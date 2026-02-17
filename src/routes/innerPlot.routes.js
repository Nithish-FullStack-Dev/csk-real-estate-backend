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

const router = Router();

const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
const csvUpload = multer({ storage: multer.memoryStorage() });
router.post("/saveInnerPlot", uploadFields, createInnerPlot);
router.get("/by-openplot/:_id", getInnerPlotById);
router.get("/getAllInnerPlot/:openPlotId", getAllInnerPlot);
router.put("/updateInnerPlot/:_id", uploadFields, updateInnerPlot);
router.delete("/deleteInnerPlot/:_id", deleteInnerPlot);
router.post("/generate-bulk", generateBulkInnerPlots);
router.post("/csv-upload", csvUpload.single("file"), bulkCsvInnerPlots);

router.get("/getInnerPlotDropdown/:openPlotId", getInnerPlotDropdown);

export default router;
