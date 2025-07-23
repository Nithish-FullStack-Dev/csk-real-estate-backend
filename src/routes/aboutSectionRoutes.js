import express from "express";
import {
  addAboutSection,
  deleteAboutSection,
  getAllAboutSection,
  updateAboutSection,
} from "../controller/aboutSectionController.js";

const router = express.Router();

router.post("/addAboutSec", addAboutSection);
router.get("/getAboutSec", getAllAboutSection);
router.put("/updateAboutSec/:id", updateAboutSection);
router.delete("/deleteAboutSec/:id", deleteAboutSection);

export default router;
