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
router.get("/getBuildingById/:_id", authenticate, getBuildingById);

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
router.get("/getUpcomingBuilding", authenticate, getUpcomingBuilding);
router.get("/getOngoingBuilding", authenticate, getOngoingBuilding);
router.get("/getCompletedBuilding", authenticate, getCompletedBuilding);
router.get("/trash", authenticate, getTrashedBuildings);
router.patch("/restore/:id", authenticate, restoreBuilding);
router.delete("/delete-permanent/:id", authenticate, deleteBuildingPermanently);

export default router;
