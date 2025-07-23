import express from "express";
import { getTotalUsers } from "../controller/adminController.js";
import { authenticate,authorizeRoles } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.get("/getTotalUsers",authenticate,authorizeRoles("admin"),getTotalUsers);

export default router;
