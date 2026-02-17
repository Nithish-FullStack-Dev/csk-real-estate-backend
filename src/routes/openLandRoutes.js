import express from "express";
import {
  addInterestedCustomer,
  createOpenLand,
  deleteOpenLandById,
  getAllOpenLand,
  getOpenLandById,
  removeInterestedCustomer,
  updateInterestedCustomer,
  updateOpenLand,
  markAsSold,
  getOpenLandDropdown,
} from "../controller/openLandController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js"; // 🔥 ADD THIS

const router = express.Router();

router.get("/getOpenLandDropdown", authenticate, getOpenLandDropdown);

// 🔥 CREATE OPEN LAND (FILES SUPPORT)
router.post(
  "/saveOpenLand",
  upload.fields([
    { name: "thumbnailUrl", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "brochureUrl", maxCount: 1 },
  ]),
  createOpenLand,
);

router.get("/getAllOpenLand", getAllOpenLand);
router.get("/getOpenLandById/:id", getOpenLandById);
router.delete("/deleteOpenLand/:id", deleteOpenLandById);

// 🔥 UPDATE OPEN LAND (FILES SUPPORT)
router.put(
  "/updateOpenLand/:id",
  upload.fields([
    { name: "thumbnailUrl", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "brochureUrl", maxCount: 1 },
  ]),
  updateOpenLand,
);

router.post("/:id/addInterestedCustomer", addInterestedCustomer);

router.put(
  "/:id/updateInterestedCustomer/:interestId",
  updateInterestedCustomer,
);

router.delete(
  "/:id/removeInterestedCustomer/:interestId",
  removeInterestedCustomer,
);

router.post("/:id/markAsSold", markAsSold);

export default router;
