import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { createUnit } from "../controller/propertyunit.controller.js";

const router = Router();

router.post(
  "/createUnit",
  upload.fields([
    {
      name: "thumbnailUrl",
      maxCount: 1,
    },
  ]),
  createUnit
);

export default router;
