import { Router } from "express";
import {
  createFloor,
  deleteFloorById,
  getAllFloorsByBuildingId,
  getAllFloorsByBuildingIdForDropDown,
  updateFloorById,
} from "../controller/floor.controller.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/createFloor", authenticate, upload.none(), createFloor);

router.get("/getAllFloorsByBuildingId/:buildingId", getAllFloorsByBuildingId);
router.get(
  "/getAllFloorsByBuildingIdForDropDown/:buildingId",
  getAllFloorsByBuildingIdForDropDown,
);
router.patch(
  "/updateFloorById/:_id",
  authenticate,
  upload.none(),
  updateFloorById,
);
router.delete("/deleteFloorById/:_id", authenticate, deleteFloorById);

export default router;
