import express from "express";
import {
  deleteBannerById,
  getAllBanners,
  getContactInfo,
  updateContactInfo,
  upsertBanner,
  upsertBanners,
} from "../controller/cmsController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/addCms",
  authenticate,
  authorizeRoles("admin", "owner"),
  upsertBanner
);
router.post(
  "/addAllCms",
  authenticate,
  authorizeRoles("admin", "owner"),
  upsertBanners
);
router.get("/getAllCms", getAllBanners);
router.delete(
  "/deleteCms/:id",
  authenticate,
  authorizeRoles("admin", "owner"),
  deleteBannerById
);
router.get(
  "/getContactInfo",
  authenticate,
  authorizeRoles("admin", "owner"),
  getContactInfo
);
router.post(
  "/updateContactInfo",
  authenticate,
  authorizeRoles("admin", "owner"),
  updateContactInfo
);

export default router;
