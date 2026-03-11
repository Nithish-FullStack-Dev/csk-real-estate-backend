import express from "express";
import {
  secureVerifyOtp,
  sendOtp,
  verifyOtp,
} from "../controller/authController.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/verify-otp-access", secureVerifyOtp);

export default router;
