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
  getOpenLandForCustomer,
  getAllOpenLandForPublic,
  restoreLand,
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
  authenticate,
  createOpenLand,
);

router.get("/getAllOpenLand", authenticate, getAllOpenLand);
router.get("/getAllOpenLandForPublic", getAllOpenLandForPublic);
router.get("/public/getOpenLandById/:id", authenticate, getOpenLandById);
router.get("/getOpenLandById/:id", getOpenLandById);
router.delete("/deleteOpenLand/:id", authenticate, deleteOpenLandById);

// 🔥 UPDATE OPEN LAND (FILES SUPPORT)
router.put(
  "/updateOpenLand/:id",
  upload.fields([
    { name: "thumbnailUrl", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "brochureUrl", maxCount: 1 },
  ]),
  authenticate,
  updateOpenLand,
);

router.post("/:id/addInterestedCustomer", authenticate, addInterestedCustomer);

router.put(
  "/:id/updateInterestedCustomer/:interestId",
  authenticate,
  updateInterestedCustomer,
);

router.delete(
  "/:id/removeInterestedCustomer/:interestId",
  authenticate,
  removeInterestedCustomer,
);

router.post("/:id/markAsSold", authenticate, markAsSold);

router.get(
  "/getOpenLandForCustomer/:openLandId",
  authenticate,
  getOpenLandForCustomer,
);

router.patch("/restore/:id", authenticate, restoreLand);

export default router;
