import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { initiate, callback, getAccount, disconnect, connectWithToken } from "../controllers/instagram.controller.js";

const router = express.Router();

// Full OAuth flow (production)
router.get("/connect", authMiddleware, initiate);
router.get("/callback", callback);
router.get("/account", authMiddleware, getAccount);
router.delete("/account", authMiddleware, disconnect);

// Dev/test shortcut — only active when INSTAGRAM_DEV_TOKEN_ENABLED=true in .env
router.post("/connect-token", authMiddleware, connectWithToken);

export default router;
