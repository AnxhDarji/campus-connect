/**
 * socialCaptionService.js
 * Reuses the existing Gemini client pattern to generate Instagram captions
 * for EVENT_PROMOTION and EVENT_RESULT post types.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const CAPTION_SCHEMA = {
  type: "object",
  properties: {
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    callToAction: { type: "string" },
    shortPreview: { type: "string" },
  },
  required: ["caption", "hashtags", "callToAction", "shortPreview"],
};

function buildPromotionPrompt(event) {
  const na = (v) => (v && String(v).trim() ? String(v).trim() : null);
  const date = event.start_date ? new Date(event.start_date).toDateString() : null;
  const endDate =
    event.end_date && String(event.end_date) !== String(event.start_date)
      ? ` – ${new Date(event.end_date).toDateString()}`
      : "";

  return `You are a social media manager for CampusConnect, a college campus platform.
Generate an Instagram promotional post for the following upcoming event.

CRITICAL RULES:
1. Use ONLY the information provided. Do NOT invent facts, statistics, or details.
2. If a field is null/missing, do not mention it.
3. Write an engaging, authentic Instagram caption — not a press release.
4. Include relevant emojis naturally (not excessively).
5. Structure: hook opening → event details → why attend → call-to-action.
6. If registration_link exists, include it in callToAction. Otherwise do not invent one.
7. Hashtags: 8–15 relevant tags. Include #CampusConnect and department/club context.
8. shortPreview: one punchy sentence (max 125 chars) for notifications.
9. Return valid JSON matching the schema exactly.

--- EVENT INFORMATION ---
Title: ${event.title}
Category: ${event.category}
Department: ${na(event.department_id?.name) || "Not provided"}
Club/Organization: ${na(event.club_name) || na(event.organization_name) || "Not provided"}
Description: ${na(event.description) || "Not provided"}
Date: ${date ? `${date}${endDate}` : "Not provided"}
Time: ${na(event.start_time) || "Not provided"} – ${na(event.end_time) || "Not provided"}
Venue: ${na(event.venue) || "Not provided"}${event.building ? `, ${event.building}` : ""}
Registration Required: ${event.registration_required ? "Yes" : "No"}
Registration Link: ${na(event.registration_link) || "Not provided"}
Registration Deadline: ${event.registration_deadline ? new Date(event.registration_deadline).toDateString() : "Not provided"}
Website: ${na(event.website_url) || "Not provided"}`;
}

function buildResultPrompt(event, completion, report) {
  const na = (v) => (v && String(v).trim() ? String(v).trim() : null);
  const highlights =
    report?.report_data?.keyHighlights?.join("; ") || na(completion?.key_highlights) || null;
  const achievements =
    report?.report_data?.achievements?.join("; ") || na(completion?.winners_achievements) || null;
  const outcomes =
    report?.report_data?.eventOutcomes?.join("; ") || na(completion?.event_outcomes) || null;

  return `You are a social media manager for CampusConnect, a college campus platform.
Generate an Instagram post celebrating the successful completion of the following event.

CRITICAL RULES:
1. Use ONLY the information provided. Do NOT invent winners, attendance numbers, quotes, or statistics.
2. If a field is null/missing, do not mention it.
3. Write a warm, celebratory caption — not a formal report.
4. Include relevant emojis naturally.
5. Structure: celebration hook → what happened → highlights/achievements → thank you/closing.
6. Hashtags: 8–15 relevant tags. Include #CampusConnect and event-specific context.
7. shortPreview: one punchy sentence (max 125 chars).
8. Return valid JSON matching the schema exactly.

--- EVENT INFORMATION ---
Title: ${event.title}
Category: ${event.category}
Department: ${na(event.department_id?.name) || "Not provided"}
Club/Organization: ${na(event.club_name) || na(event.organization_name) || "Not provided"}
Date: ${event.start_date ? new Date(event.start_date).toDateString() : "Not provided"}
Venue: ${na(event.venue) || "Not provided"}

--- COMPLETION DATA ---
Actual Attendance: ${completion?.actual_attendance ?? "Not provided"}
Key Highlights: ${highlights || "Not provided"}
Winners / Achievements: ${achievements || "Not provided"}
Special Guests: ${na(completion?.special_guests) || "Not provided"}
Event Outcomes: ${outcomes || "Not provided"}
AI Report Overview: ${report?.report_data?.eventOverview || "Not provided"}`;
}

async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", responseSchema: CAPTION_SCHEMA },
  });

  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (err) {
      const isTransient = /\[(429|5\d\d)\b/.test(err.message || "");
      if (!isTransient || attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("Gemini returned invalid JSON for caption generation.");
  }

  for (const field of ["caption", "hashtags", "callToAction", "shortPreview"]) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Gemini caption response missing required field: ${field}`);
    }
  }

  if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
  return parsed;
}

export async function generatePromotionCaption(event) {
  return callGemini(buildPromotionPrompt(event));
}

export async function generateResultCaption(event, completion, report) {
  return callGemini(buildResultPrompt(event, completion, report));
}
