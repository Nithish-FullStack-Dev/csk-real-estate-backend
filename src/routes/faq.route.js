import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  addFaq,
  deleteFaq,
  getAllFaq,
  updateFaq,
} from "../controller/faq.controller.js";

const router = express.Router();

router.post("/add", authenticate, addFaq);
router.get("/getAll", authenticate, getAllFaq);
router.get("/getAllPublic", getAllFaq);
router.patch("/update/:id", authenticate, updateFaq);
router.delete("/delete/:id", authenticate, deleteFaq);

export default router;
