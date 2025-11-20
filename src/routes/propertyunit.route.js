import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createUnit,
  deleteUnit,
  getAvailableUnitsByFloorIdAndBuildingIdForDropDown,
  getPurchasedCustomerUnits,
  getUnit,
  getUnitsByFloorIdAndBuildingId,
  getUnitsByFloorIdAndBuildingIdForDropDown,
  updateUnit,
} from "../controller/propertyunit.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post(
  "/createUnit",
  upload.fields([
    {
      name: "thumbnailUrl",
      maxCount: 1,
    },
    {
      name: "documents",
      maxCount: 5,
    },
    {
      name: "images",
      maxCount: 5,
    },
  ]),
  createUnit
);

router.get(
  "/getUnitsByFloorIdAndBuildingId/:buildingId/:floorId",
  authenticate,
  getUnitsByFloorIdAndBuildingId
);

router.get(
  "/getAvailableUnitsByFloorIdAndBuildingIdForDropDown/:buildingId/:floorId",
  authenticate,
  getAvailableUnitsByFloorIdAndBuildingIdForDropDown
);

router.get(
  "/getUnitsByFloorIdAndBuildingIdForDropDown/:buildingId/:floorId",
  authenticate,
  getUnitsByFloorIdAndBuildingIdForDropDown
);

router.get("/getUnit/:unitId", authenticate, getUnit);

router.get(
  "/getCustomersByUnit/:unitId",
  authenticate,
  getPurchasedCustomerUnits
);

router.patch(
  "/updateUnit/:unitId",
  upload.fields([
    { name: "thumbnailUrl", maxCount: 1 },
    { name: "documents", maxCount: 5 },
    { name: "images", maxCount: 5 },
  ]),
  updateUnit
);

router.delete("/deleteUnit/:unitId", authenticate, deleteUnit);
export default router;
