import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createInnerPlot,
  getInnerPlotsByOpenPlot,
  updateInnerPlot,
  deleteInnerPlot,
  getAllInnerPlot,
} from "../controller/innerPlot.controller.js";

const router = Router();

const uploadFields = upload.fields([
  { name: "thumbnailUrl", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.post("/saveInnerPlot", uploadFields, createInnerPlot);
router.get("/by-openplot/:openPlotId", getInnerPlotsByOpenPlot);
router.get("/getAllInnerPlot/:openPlotId", getAllInnerPlot);
router.put("/updateInnerPlot/:_id", uploadFields, updateInnerPlot);
router.delete("/deleteInnerPlot/:_id", deleteInnerPlot);

export default router;
