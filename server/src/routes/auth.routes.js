import express from "express";
import { register, verifyOTP, resendOTP, login, logout } from "../controllers/auth.controller.js";
import { validateRegister, validateVerifyOTP, validateResendOTP, validateLogin } from "../middleware/validators.js";
import { otpRateLimiter, resendOtpRateLimiter } from "../middleware/rateLimiter.js";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/verify-otp", otpRateLimiter, validateVerifyOTP, verifyOTP);
router.post("/resend-otp", resendOtpRateLimiter, validateResendOTP, resendOTP);
router.post("/login", validateLogin, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

export default router;
