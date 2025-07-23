// routes/materialRoutes.js
import express from "express";
import { getAllMaterials,createMaterial,updateMaterialStatus } from "../controller/materialController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/materials
router.get("/",authenticate, getAllMaterials);
router.post("/",authenticate, createMaterial);
// PATCH /api/materials/:id/status
router.patch("/:id/status", updateMaterialStatus);

export default router;