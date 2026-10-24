import { Router } from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  registerForEvent,
  getMyRegistration,
  getQRPass,
  verifyQR,
  getAttendanceStats,
  getAttendanceList,
  downloadCSV,
  downloadXLSX,
} from "../controllers/registration.controller.js";

const router = Router();
const guard = [authMiddleware];

const qrVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many scan requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Student routes
router.post("/:eventId/register", ...guard, registerForEvent);
router.get("/:eventId/my", ...guard, getMyRegistration);
router.get("/:eventId/qr-pass", ...guard, getQRPass);

// Organizer routes
router.post("/:eventId/verify-qr", ...guard, qrVerifyLimiter, verifyQR);
router.get("/:eventId/attendance/stats", ...guard, getAttendanceStats);
router.get("/:eventId/attendance/list", ...guard, getAttendanceList);
router.get("/:eventId/report/csv", ...guard, downloadCSV);
router.get("/:eventId/report/xlsx", ...guard, downloadXLSX);

export default router;
