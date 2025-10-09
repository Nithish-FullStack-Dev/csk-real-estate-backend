import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
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
router.get("/getBuildingById/:_id", getBuildingById);

router.patch(
  "/updateBuilding/:_id",
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
  updateBuilding
);

router.delete("/deleteBuilding", deleteBuilding);

export default router;
