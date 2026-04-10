import express from "express";
import {
  createJobPost,
  deleteJobPost,
  getJobPosts,
  updateJobPost,
} from "../controller/jobPost.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/createjobPost", authenticate, createJobPost);
router.get("/getJobPosts", getJobPosts);
router.put("/updateJobPost/:id", authenticate, updateJobPost);
router.delete("/deleteJobPost/:id", authenticate, deleteJobPost);

export default router;
