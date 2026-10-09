/**
 * socialPostController.js
 * Handles all social post HTTP endpoints.
 */

import * as svc from "../services/social/socialPostService.js";
import { isMockMode } from "../services/instagram/instagramProvider.js";

// GET /api/social/events/:eventId/drafts
export const listDrafts = async (req, res, next) => {
  try {
    const drafts = await svc.getAllDraftsForEvent(req.params.eventId, req.user.id);
    res.json({ success: true, data: drafts });
  } catch (err) { next(err); }
};

// GET /api/social/events/:eventId/drafts/:postType
export const getDraftByType = async (req, res, next) => {
  try {
    const draft = await svc.getDraftByEvent(req.params.eventId, req.user.id, req.params.postType);
    res.json({ success: true, data: draft || null });
  } catch (err) { next(err); }
};

// POST /api/social/events/:eventId/drafts
// body: { postType: "EVENT_PROMOTION" | "EVENT_RESULT" }
export const createDraft = async (req, res, next) => {
  try {
    const { postType } = req.body;
    if (!["EVENT_PROMOTION", "EVENT_RESULT"].includes(postType)) {
      return res.status(400).json({ success: false, message: "postType must be EVENT_PROMOTION or EVENT_RESULT." });
    }
    const draft = await svc.getOrCreateDraft(req.params.eventId, req.user.id, req.user.role, postType);
    res.status(201).json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// GET /api/social/drafts/:draftId
export const getDraft = async (req, res, next) => {
  try {
    const draft = await svc.getDraft(req.params.draftId, req.user.id);
    res.json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// PATCH /api/social/drafts/:draftId
export const updateDraft = async (req, res, next) => {
  try {
    const draft = await svc.updateDraft(req.params.draftId, req.user.id, req.body);
    res.json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// POST /api/social/drafts/:draftId/generate-caption
export const generateCaption = async (req, res, next) => {
  try {
    const draft = await svc.generateCaption(req.params.draftId, req.user.id, req.user.role);
    res.json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// POST /api/social/drafts/:draftId/approve
export const approveDraft = async (req, res, next) => {
  try {
    const draft = await svc.approveDraft(req.params.draftId, req.user.id, req.user.role);
    res.json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// POST /api/social/drafts/:draftId/publish
export const publishDraft = async (req, res, next) => {
  try {
    const { record, isMock } = await svc.publishDraft(req.params.draftId, req.user.id, req.user.role);
    res.json({
      success: true,
      message: isMock
        ? "Demo Instagram post published successfully (MOCK PROVIDER — not a real Instagram post)."
        : "Instagram post published successfully.",
      isMock,
      data: {
        recordId: record._id,
        providerMediaId: record.providerMediaId,
        publishedAt: record.publishedAt,
        status: record.status,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/social/drafts/:draftId/schedule
export const scheduleDraft = async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: "scheduledAt is required." });
    }
    const draft = await svc.scheduleDraft(req.params.draftId, req.user.id, req.user.role, scheduledAt);
    res.json({ success: true, data: draft });
  } catch (err) { next(err); }
};

// GET /api/social/events/:eventId/history
export const getHistory = async (req, res, next) => {
  try {
    const records = await svc.getPublishingHistory(req.params.eventId, req.user.id);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

// GET /api/social/mode
export const getMode = (_req, res) => {
  res.json({ success: true, mode: isMockMode() ? "mock" : "real" });
};
