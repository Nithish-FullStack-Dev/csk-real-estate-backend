import express from "express";
import {
  createJobPost,
  deleteJobPost,
  getJobPosts,
  getPublishedCareers,
  updateJobPost,
  updateJobPostStatus,
} from "../controller/jobPost.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/createjobPost", authenticate, createJobPost);
router.get("/getJobPosts", authenticate, getJobPosts);
router.get("/getPublishedCareers", getPublishedCareers);
router.put("/updateJobPost/:id", authenticate, updateJobPost);
router.delete("/deleteJobPost/:id", authenticate, deleteJobPost);
router.patch("/updateJobPostStatus/:id", authenticate, updateJobPostStatus);

export default router;
