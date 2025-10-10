import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createUnit,
  deleteUnit,
  getUnit,
  getUnitsByFloorIdAndBuildingId,
  updateUnit,
} from "../controller/propertyunit.controller.js";

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

router.get(
  "/getUnitsByFloorIdAndBuildingId/:buildingId/:floorId",
  getUnitsByFloorIdAndBuildingId
);
router.get("/getUnit/:unitId", getUnit);

router.patch(
  "/updateUnit/:unitId",
  upload.fields([
    { name: "thumbnailUrl", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  updateUnit
);

router.delete("/deleteUnit/:unitId", deleteUnit);
export default router;
