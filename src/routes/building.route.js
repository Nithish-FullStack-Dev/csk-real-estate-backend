import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  deleteBuildingPermanently,
  getAllBuildings,
  getBuildingById,
  getCompletedBuilding,
  getOngoingBuilding,
  getTrashedBuildings,
  getUpcomingBuilding,
  restoreBuilding,
  updateBuilding,
} from "../controller/building.controller.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";

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
    {
      name: "images",
      maxCount: 5,
    },
  ]),
  authenticate,
  createBuilding,
);

router.get("/getAllBuildings", authenticate, getAllBuildings);
router.get("/getBuildingById/:_id", getBuildingById);

router.patch(
  "/updateBuilding/:_id",
  authenticate,
  upload.fields([
    {
      name: "thumbnailUrl",
      maxCount: 1,
    },
    {
      name: "brochureUrl",
      maxCount: 1,
    },
    {
      name: "images",
      maxCount: 5,
    },
  ]),
  updateBuilding,
);

router.delete("/deleteBuilding/:_id", authenticate, deleteBuilding);
router.get("/getUpcomingBuilding", getUpcomingBuilding);
router.get("/getOngoingBuilding", getOngoingBuilding);
router.get("/getCompletedBuilding", getCompletedBuilding);
router.get("/trash", authenticate, getTrashedBuildings);
router.patch("/restore/:id", authenticate, restoreBuilding);
router.delete("/delete-permanent/:id", authenticate, deleteBuildingPermanently);

export default router;
