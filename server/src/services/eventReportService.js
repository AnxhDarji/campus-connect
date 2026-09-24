import EventRequest from "../models/EventRequest.js";
import EventCompletion from "../models/EventCompletion.js";
import EventReport from "../models/EventReport.js";
import { generateEventReport } from "./geminiService.js";

function buildPrompt(event, completion) {
  const na = (val) => (val && val.trim() ? val.trim() : "Not provided");

  return `You are generating a formal event report for CampusConnect, a college campus platform.

CRITICAL RULES:
1. Use ONLY the information provided below. Do NOT invent, fabricate, or assume any facts.
2. If a field says "Not provided", reflect that honestly — do not make up content.
3. Do not add quotes, statistics, or details not present in the source data.
4. Write like a skilled campus communications editor: polished, warm, specific, and engaging without sounding promotional or exaggerated.
5. Make this report feel written for THIS event. Use the title, category, description, highlights, outcomes, achievements, and guests to create natural connections.
6. Avoid templates, repeated sentence patterns, filler, and stock phrases such as "The event recorded an actual attendance of", "The event concluded with", "was a resounding success", or "marked a significant milestone".
7. Do not force every field into the same formula. Vary sentence openings and structure while keeping the writing clear and factual.
8. Mention attendance, guests, achievements, or outcomes only when they add useful context. Never inflate their importance.
9. Keep the full report short and readable: usually 2-3 sentences for prose fields and 1 concise sentence per list item.
10. Return a valid JSON object matching the required schema exactly.

--- ORIGINAL EVENT INFORMATION ---
Title: ${event.title}
Category: ${event.category}
Department: ${event.department_id?.name || "Not provided"}
Club/Organization: ${event.club_name || event.organization_name || "Not provided"}
Date: ${new Date(event.start_date).toDateString()} to ${new Date(event.end_date).toDateString()}
Time: ${event.start_time} – ${event.end_time}
Venue: ${event.venue}${event.building ? `, ${event.building}` : ""}${event.room ? `, Room ${event.room}` : ""}
Description: ${na(event.description)}

--- ORGANIZER COMPLETION DATA ---
Actual Attendance: ${completion.actual_attendance}
Key Highlights: ${na(completion.key_highlights)}
Winners / Achievements: ${na(completion.winners_achievements)}
Special Guests: ${na(completion.special_guests)}
Event Outcomes: ${na(completion.event_outcomes)}

--- REQUIRED JSON OUTPUT SCHEMA ---
{
  "eventOverview": "A concise, distinctive 2-3 sentence overview that captures the event's subject and character from the title, category, and description. Do not begin with 'The event'.",
  "participationSummary": "One brief, natural sentence connecting attendance to this specific event. Do not use a generic attendance announcement.",
  "keyHighlights": ["Concise, vivid points drawn only from key_highlights. Preserve the organizer's meaning while improving clarity. Return [] if not provided."],
  "achievements": ["Concise points drawn only from winners_achievements. Return [] if not provided."],
  "eventOutcomes": ["Concise points drawn only from event_outcomes. Return [] if not provided."],
  "conclusion": "A memorable 1-2 sentence closing reflection grounded in the verified outcomes, achievements, highlights, or special guests. Avoid generic praise and do not begin with 'Overall'."
}`;
}

/**
 * Triggers AI report generation for a completed event.
 * Completion must already be saved and event must be COMPLETED.
 * This function is safe to call independently — it will not affect completion data.
 */
export async function generateAndStoreReport(eventId, { force = false } = {}) {
  // Load event and completion
  const [event, completion] = await Promise.all([
    EventRequest.findById(eventId).populate("department_id", "name code"),
    EventCompletion.findOne({ event_id: eventId }),
  ]);

  if (!event || !completion) throw new Error("Event or completion not found.");

  // Find or create report record
  let report = await EventReport.findOne({ event_id: eventId });

  if (report) {
    // Keep an existing report unless an explicit regeneration was requested.
    if (report.generation_status === "GENERATED" && !force) return report;
    // Reset for retry
    report.generation_status = "GENERATING";
    report.error_message = null;
    report.report_data = null;
    report.generated_at = null;
  } else {
    report = new EventReport({
      event_id: eventId,
      completion_id: completion._id,
      generation_status: "GENERATING",
    });
  }

  await report.save();

  try {
    const prompt = buildPrompt(event, completion);
    const reportData = await generateEventReport(prompt);

    report.report_data = reportData;
    report.generation_status = "GENERATED";
    report.generated_at = new Date();
    report.error_message = null;
    await report.save();

    return report;
  } catch (err) {
    report.generation_status = "FAILED";
    report.error_message = err.message || "AI generation failed.";
    await report.save();
    throw err;
  }
}
