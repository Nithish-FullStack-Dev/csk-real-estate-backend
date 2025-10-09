import { Router } from "express";
import {
  createFloor,
  deleteFloorById,
  getAllFloorsByBuildingId,
  updateFloorById,
} from "../controller/floor.controller.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.post("/createFloor", upload.none(), createFloor);

router.get("/getAllFloorsByBuildingId/:buildingId", getAllFloorsByBuildingId);
router.patch("/updateFloorById/:_id", upload.none(), updateFloorById);
router.delete("/deleteFloorById/:_id", deleteFloorById);

export default router;
