import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  listDrafts,
  getDraftByType,
  createDraft,
  getDraft,
  updateDraft,
  generateCaption,
  approveDraft,
  publishDraft,
  scheduleDraft,
  getHistory,
  getMode,
} from "../controllers/socialPostController.js";

const router = Router();
const auth = [authMiddleware];

// Mode info (no auth needed for frontend to check)
router.get("/mode", getMode);

// Per-event draft management
router.get("/events/:eventId/drafts", ...auth, listDrafts);
router.get("/events/:eventId/drafts/:postType", ...auth, getDraftByType);
router.post("/events/:eventId/drafts", ...auth, createDraft);
router.get("/events/:eventId/history", ...auth, getHistory);

// Draft lifecycle
router.get("/drafts/:draftId", ...auth, getDraft);
router.patch("/drafts/:draftId", ...auth, updateDraft);
router.post("/drafts/:draftId/generate-caption", ...auth, generateCaption);
router.post("/drafts/:draftId/approve", ...auth, approveDraft);
router.post("/drafts/:draftId/publish", ...auth, publishDraft);
router.post("/drafts/:draftId/schedule", ...auth, scheduleDraft);

export default router;
