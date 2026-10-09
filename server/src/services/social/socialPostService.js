/**
 * socialPostService.js
 * Core service for the Instagram social post workflow.
 * Handles: draft creation, caption generation, approval, publish-now.
 */

import SocialPostDraft from "../../models/SocialPostDraft.js";
import SocialPublishingRecord from "../../models/SocialPublishingRecord.js";
import SocialAccount from "../../models/SocialAccount.js";
import EventRequest from "../../models/EventRequest.js";
import EventCompletion from "../../models/EventCompletion.js";
import EventReport from "../../models/EventReport.js";
import { generatePromotionCaption, generateResultCaption } from "./socialCaptionService.js";
import { resolveSocialMediaUrl } from "./mediaResolver.js";
import { getInstagramProvider, isMockMode } from "../instagram/instagramProvider.js";
import { decryptToken } from "../instagram/tokenCrypto.js";
import { uploadImageToCloudinary } from "../cloudinaryService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertOwnership(draft, userId) {
  if (draft.userId.toString() !== userId.toString()) {
    const err = new Error("You do not have permission to access this draft.");
    err.status = 403;
    throw err;
  }
}

async function loadEventWithOwnership(eventId, userId, userRole) {
  const event = await EventRequest.findOne({ _id: eventId, is_deleted: false }).populate(
    "department_id",
    "name code"
  );
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  const ADMIN_ROLES = ["Super Admin", "Admin", "Dept Admin"];
  if (!ADMIN_ROLES.includes(userRole) && event.submitted_by.toString() !== userId.toString()) {
    const err = new Error("You are not authorized to manage social posts for this event.");
    err.status = 403;
    throw err;
  }
  return event;
}

// ─── Draft Management ─────────────────────────────────────────────────────────

export async function getOrCreateDraft(eventId, userId, userRole, postType) {
  await loadEventWithOwnership(eventId, userId, userRole);
  let draft = await SocialPostDraft.findOne({ eventId, userId, postType });
  if (!draft) {
    draft = await SocialPostDraft.create({ userId, eventId, postType, status: "DRAFT" });
  }
  return draft;
}

export async function getDraft(draftId, userId) {
  const draft = await SocialPostDraft.findById(draftId);
  if (!draft) {
    const err = new Error("Draft not found.");
    err.status = 404;
    throw err;
  }
  assertOwnership(draft, userId);
  return draft;
}

export async function getDraftByEvent(eventId, userId, postType) {
  return SocialPostDraft.findOne({ eventId, userId, postType });
}

export async function updateDraft(draftId, userId, updates) {
  const draft = await getDraft(draftId, userId);
  if (["PUBLISHED", "PUBLISHING"].includes(draft.status)) {
    const err = new Error("Cannot edit a draft that is already published or being published.");
    err.status = 400;
    throw err;
  }
  const allowed = ["posterUrl", "sourceType", "caption", "hashtags", "finalCaption", "socialAccountId"];
  for (const key of allowed) {
    if (updates[key] !== undefined) draft[key] = updates[key];
  }
  if (draft.status === "APPROVED") draft.status = "READY_FOR_REVIEW";
  await draft.save();
  return draft;
}

// ─── Caption Generation ───────────────────────────────────────────────────────

export async function generateCaption(draftId, userId, userRole) {
  const draft = await getDraft(draftId, userId);
  const event = await loadEventWithOwnership(draft.eventId, userId, userRole);

  draft.status = "GENERATING";
  await draft.save();

  try {
    let result;
    if (draft.postType === "EVENT_PROMOTION") {
      result = await generatePromotionCaption(event);
    } else {
      const [completion, report] = await Promise.all([
        EventCompletion.findOne({ event_id: draft.eventId }),
        EventReport.findOne({ event_id: draft.eventId }),
      ]);
      result = await generateResultCaption(event, completion, report);
    }

    draft.caption = result.caption;
    draft.hashtags = result.hashtags;
    draft.finalCaption = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    draft.generatedByAI = true;
    draft.aiModel = "gemini-2.5-flash";
    draft.status = "READY_FOR_REVIEW";
    await draft.save();
    return draft;
  } catch (err) {
    draft.status = "DRAFT";
    await draft.save();
    throw err;
  }
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export async function approveDraft(draftId, userId, userRole) {
  const draft = await getDraft(draftId, userId);
  await loadEventWithOwnership(draft.eventId, userId, userRole);

  if (!["READY_FOR_REVIEW", "DRAFT"].includes(draft.status)) {
    const err = new Error(`Draft cannot be approved in status: ${draft.status}`);
    err.status = 400;
    throw err;
  }
  if (!draft.posterUrl) {
    const err = new Error("A poster/image must be selected before approving.");
    err.status = 400;
    throw err;
  }
  if (!draft.finalCaption && !draft.caption) {
    const err = new Error("A caption must be generated or written before approving.");
    err.status = 400;
    throw err;
  }

  draft.status = "APPROVED";
  draft.approvedAt = new Date();
  draft.approvedBy = userId;
  if (!draft.finalCaption) {
    draft.finalCaption = `${draft.caption}\n\n${draft.hashtags.join(" ")}`;
  }
  await draft.save();
  return draft;
}

// ─── Publish Now ──────────────────────────────────────────────────────────────

export async function publishDraft(draftId, userId, userRole) {
  const draft = await getDraft(draftId, userId);
  await loadEventWithOwnership(draft.eventId, userId, userRole);

  if (draft.status !== "APPROVED") {
    const err = new Error("Draft must be approved before publishing.");
    err.status = 400;
    throw err;
  }

  // Prevent duplicate publish
  const existing = await SocialPublishingRecord.findOne({
    draftId,
    status: { $in: ["PUBLISHED", "PUBLISHING"] },
  });
  if (existing) {
    const err = new Error("This draft has already been published or is currently being published.");
    err.status = 409;
    throw err;
  }

  // Resolve media URL — auto-upload to Cloudinary if local and in real mode
  let rawUrl = draft.posterUrl;
  if (!isMockMode() && rawUrl && (rawUrl.startsWith("/uploads/") || rawUrl.startsWith("uploads/"))) {
    const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`;
    const fullLocalUrl = `${base}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
    try {
      const cloudUrl = await uploadImageToCloudinary(fullLocalUrl, "campus-connect/social");
      if (cloudUrl && cloudUrl.startsWith("https://")) {
        rawUrl = cloudUrl;
        // Save the resolved Cloudinary URL back to the draft so future publishes reuse it
        await SocialPostDraft.findByIdAndUpdate(draftId, { posterUrl: cloudUrl });
        draft.posterUrl = cloudUrl;
      }
    } catch (uploadErr) {
      console.warn("[Social] Cloudinary auto-upload failed:", uploadErr.message);
    }
  }
  const mediaUrl = resolveSocialMediaUrl(rawUrl);

  // Load social account
  const accountQuery = draft.socialAccountId
    ? { _id: draft.socialAccountId, owner: userId }
    : { owner: userId, provider: "instagram" };
  const account = await SocialAccount.findOne(accountQuery).select("+encryptedAccessToken");
  if (!account) {
    const err = new Error("No connected Instagram account found. Please connect your Instagram account first.");
    err.status = 400;
    throw err;
  }

  const caption = draft.finalCaption || `${draft.caption}\n\n${draft.hashtags.join(" ")}`;

  // Create publishing record
  const record = await SocialPublishingRecord.create({
    userId,
    eventId: draft.eventId,
    socialAccountId: account._id,
    draftId,
    provider: "instagram",
    postType: draft.postType,
    mediaUrl,
    caption,
    hashtags: draft.hashtags,
    startedAt: new Date(),
    status: "PUBLISHING",
    isMock: isMockMode(),
  });

  draft.status = "PUBLISHING";
  await draft.save();

  try {
    const provider = getInstagramProvider();
    let token = null;
    if (!isMockMode()) {
      token = decryptToken(account.encryptedAccessToken);
    }

    const { containerId } = await provider.createMediaContainer(
      token,
      account.providerUserId,
      mediaUrl,
      caption
    );
    record.providerContainerId = containerId;

    // Poll container status (real mode only; mock returns FINISHED immediately)
    let attempts = 0;
    while (attempts < 10) {
      const { status } = await provider.checkContainerStatus(token, containerId);
      if (status === "FINISHED" || status === "PUBLISHED") break;
      if (status === "ERROR" || status === "EXPIRED") {
        throw new Error(`Instagram media container failed with status: ${status}`);
      }
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
    }

    const { mediaId, isMock: wasMock } = await provider.publishContainer(
      token,
      account.providerUserId,
      containerId
    );

    record.providerMediaId = mediaId;
    record.publishedAt = new Date();
    record.status = "PUBLISHED";
    record.isMock = wasMock ?? isMockMode();
    await record.save();

    draft.status = "PUBLISHED";
    await draft.save();

    return { record, isMock: record.isMock };
  } catch (err) {
    record.status = "FAILED";
    record.errorMessage = err.message;
    record.errorCode = err.code || null;
    await record.save();

    draft.status = "FAILED";
    await draft.save();

    throw err;
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleDraft(draftId, userId, userRole, scheduledAt) {
  const draft = await getDraft(draftId, userId);
  await loadEventWithOwnership(draft.eventId, userId, userRole);

  if (draft.status !== "APPROVED") {
    const err = new Error("Draft must be approved before scheduling.");
    err.status = 400;
    throw err;
  }

  const schedDate = new Date(scheduledAt);
  if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
    const err = new Error("scheduledAt must be a valid future date/time.");
    err.status = 400;
    throw err;
  }

  draft.status = "SCHEDULED";
  draft.scheduledAt = schedDate;
  await draft.save();
  return draft;
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getPublishingHistory(eventId, userId) {
  return SocialPublishingRecord.find({ eventId, userId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getAllDraftsForEvent(eventId, userId) {
  return SocialPostDraft.find({ eventId, userId }).sort({ createdAt: -1 }).lean();
}
