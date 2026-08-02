import { Router } from "express";
import Department from "../models/Department.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const departments = await Department.find().select("name code").sort("name");
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
});

export default router;
