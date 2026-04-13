import express from "express";
import {
  applyJob,
  getApplicationsForJob,
} from "../controller/jobApplication.controller.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/applyJob",
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  applyJob,
);

router.get("/getApplicationsForJob", getApplicationsForJob);

export default router;
