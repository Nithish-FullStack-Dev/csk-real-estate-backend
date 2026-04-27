import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  addHeroCms,
  getAllHeroCms,
  getHeroCmsById,
  updateHeroCms,
  deleteHeroCms,
  upsertBanners,
} from "../controller/heroCms.controller.js";

const router = Router();

router.post(
  "/create",
  authenticate,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addHeroCms,
);

router.post("/addAllCms", authenticate, upsertBanners);

router.get("/all", getAllHeroCms);

router.get("/:id", getHeroCmsById);

router.put(
  "/update/:id",
  authenticate,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateHeroCms,
);

router.delete("/delete/:id", authenticate, deleteHeroCms);

export default router;
