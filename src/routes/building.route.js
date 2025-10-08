import e, { Router } from "express";
import { createBuilding } from "../controller/building.controller.js";
import { upload } from "../middlewares/multer.js";

export const router = Router();

router.post(
  "/createBuilding",
  upload.fields([
    {
      name: "thumbnailUrl",
      maxCount: 1,
    },
    {
      name: "brochureUrl",
      maxCount: 1,
    },
  ]),
  createBuilding
);

export default router;
