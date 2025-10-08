import e, { Router } from "express";
import {
  createBuilding,
  getAllBuildings,
} from "../controller/building.controller.js";
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

router.get("/getAllBuildings", getAllBuildings);

export default router;
