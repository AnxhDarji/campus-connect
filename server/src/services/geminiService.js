import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    eventOverview: { type: "string" },
    participationSummary: { type: "string" },
    keyHighlights: { type: "array", items: { type: "string" } },
    achievements: { type: "array", items: { type: "string" } },
    eventOutcomes: { type: "array", items: { type: "string" } },
    conclusion: { type: "string" },
  },
  required: ["eventOverview", "participationSummary", "keyHighlights", "achievements", "eventOutcomes", "conclusion"],
};

/**
 * Generates a structured event report using Gemini.
 * @param {string} prompt - The fully constructed prompt string
 * @returns {Promise<object>} - Parsed report_data object
 */
export async function generateEventReport(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: REPORT_SCHEMA,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  // Validate required fields exist
  const required = ["eventOverview", "participationSummary", "keyHighlights", "achievements", "eventOutcomes", "conclusion"];
  for (const field of required) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Gemini response missing required field: ${field}`);
    }
  }

  return parsed;
}
