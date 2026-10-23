import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { handleChat } from "../controllers/chat.controller.js";

const router = Router();

// Optional authentication middleware: attaches user info if authenticated cookie is present
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("role department_id").lean();
    if (user) {
      req.user = { ...payload, role: user.role, department_id: user.department_id ?? null };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
};

// Rate limiter to protect Gemini free-tier quota (15 requests per minute per user / IP)
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "You've sent too many messages in a short time. Please wait a moment before asking again.",
  },
});

router.post("/", optionalAuth, chatRateLimiter, handleChat);

export default router;
