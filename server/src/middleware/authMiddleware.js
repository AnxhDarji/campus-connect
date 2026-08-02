import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: "Not authenticated." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Always fetch fresh role + department_id from DB so manual role changes take effect immediately
    const user = await User.findById(payload.id).select("role department_id").lean();
    if (!user) return res.status(401).json({ success: false, message: "User not found." });
    req.user = { ...payload, role: user.role, department_id: user.department_id ?? null };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

export default authMiddleware;
