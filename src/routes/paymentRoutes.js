import express from "express";
import { getAccountantPayments } from "../controller/paymentsController.js";
import { authenticate,authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get("/accountant",authenticate,authorizeRoles("accountant"),getAccountantPayments);

export default router;