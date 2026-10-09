/**
 * socialSchedulingService.js
 * Database-backed scheduler — survives server restarts.
 * Polls every 60 seconds for SCHEDULED drafts whose scheduledAt has passed.
 */

import SocialPostDraft from "../../models/SocialPostDraft.js";
import { publishDraft } from "./socialPostService.js";

let _timer = null;

async function processDueDrafts() {
  const now = new Date();
  // Find SCHEDULED drafts that are due and not already being processed
  const due = await SocialPostDraft.find({
    status: "SCHEDULED",
    scheduledAt: { $lte: now },
  }).lean();

  for (const draft of due) {
    try {
      // Claim the job atomically to prevent duplicate processing
      const claimed = await SocialPostDraft.findOneAndUpdate(
        { _id: draft._id, status: "SCHEDULED" },
        { $set: { status: "APPROVED" } }, // reset to APPROVED so publishDraft can proceed
        { new: true }
      );
      if (!claimed) continue; // another process claimed it

      await publishDraft(
        String(draft._id),
        String(draft.userId),
        "Super Admin" // scheduling worker has elevated trust
      );
    } catch (err) {
      // Failure is already recorded inside publishDraft; just log
      console.error(`[Scheduler] Failed to publish draft ${draft._id}:`, err.message);
    }
  }
}

export function startScheduler(intervalMs = 60_000) {
  if (_timer) return;
  _timer = setInterval(() => {
    processDueDrafts().catch((err) =>
      console.error("[Scheduler] processDueDrafts error:", err.message)
    );
  }, intervalMs);
  console.log("[Scheduler] Social post scheduler started.");
}

export function stopScheduler() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}
