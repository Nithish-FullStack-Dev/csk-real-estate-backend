import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  getAllBuildings,
  getBuildingById,
  getCompletedBuilding,
  getOngoingBuilding,
  getUpcomingBuilding,
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

router.delete("/deleteBuilding/:_id", deleteBuilding);
router.get("/getUpcomingBuilding", getUpcomingBuilding);
router.get("/getOngoingBuilding", getOngoingBuilding);
router.get("/getCompletedBuilding", getCompletedBuilding);
export default router;
