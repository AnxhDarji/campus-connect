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
4. The report must be professional and suitable for a college audience.
5. Return a valid JSON object matching the required schema exactly.

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
  "eventOverview": "A 2-3 sentence overview of what the event was, based only on the original event information.",
  "participationSummary": "A sentence summarizing actual attendance and participation based only on completion data.",
  "keyHighlights": ["Array of highlight points based only on the key_highlights field. If not provided, return an empty array."],
  "achievements": ["Array of achievement/winner points based only on winners_achievements. If not provided, return an empty array."],
  "eventOutcomes": ["Array of outcome points based only on event_outcomes. If not provided, return an empty array."],
  "conclusion": "A 1-2 sentence professional conclusion derived only from the verified information above."
}`;
}

/**
 * Triggers AI report generation for a completed event.
 * Completion must already be saved and event must be COMPLETED.
 * This function is safe to call independently — it will not affect completion data.
 */
export async function generateAndStoreReport(eventId) {
  // Load event and completion
  const [event, completion] = await Promise.all([
    EventRequest.findById(eventId).populate("department_id", "name code"),
    EventCompletion.findOne({ event_id: eventId }),
  ]);

  if (!event || !completion) throw new Error("Event or completion not found.");

  // Find or create report record
  let report = await EventReport.findOne({ event_id: eventId });

  if (report) {
    // If already successfully generated, skip
    if (report.generation_status === "GENERATED") return report;
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
