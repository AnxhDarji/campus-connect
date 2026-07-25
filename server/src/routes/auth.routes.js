import express from "express";
import { register, verifyOTP, resendOTP, login } from "../controllers/auth.controller.js";
import { validateRegister, validateVerifyOTP, validateResendOTP, validateLogin } from "../middleware/validators.js";
import { otpRateLimiter, resendOtpRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/verify-otp", otpRateLimiter, validateVerifyOTP, verifyOTP);
router.post("/resend-otp", resendOtpRateLimiter, validateResendOTP, resendOTP);
router.post("/login", validateLogin, login);

export default router;
