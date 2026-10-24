import { uploadImageToCloudinary } from "./cloudinaryService.js";

const PALETTES = [
  ["#101827", "#182b4d", "#7dd3fc"],
  ["#102a2a", "#164e63", "#67e8f9"],
  ["#24133f", "#3b1c5a", "#c4b5fd"],
  ["#3b1727", "#5b2333", "#fda4af"],
];

const xmlEscape = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const clean = (value, maxLength = 180) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
};

function wrapText(value, maxChars, maxLines = 3) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function textBlock(value, { x, y, size, color = "#ffffff", weight = 400, maxChars, maxLines = 2, lineHeight }) {
  const lines = wrapText(value, maxChars, maxLines);
  if (!lines.length) return "";
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="Arial, Helvetica, sans-serif">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight || size * 1.25}">${xmlEscape(line)}</tspan>`)
    .join("")}</text>`;
}

async function generateAbstractBackground(event, purpose) {
  const category = clean(event.category, 48) || "campus";
  const prompt = [
    `A minimal abstract vector-style background texture for a ${purpose} poster about a ${category} university event.`,
    "Use only soft color fields, subtle gradients, and simple geometric shapes.",
    "No text, letters, numbers, logos, people, buildings, objects, photography, or identifiable scenes.",
    "Portrait 4:5 composition, restrained contrast, suitable behind readable white typography.",
  ].join(" ");
  const seed = Math.floor(Math.random() * 2_000_000_000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=800&height=1000&seed=${seed}&nologo=true`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: "image/jpeg,image/png,image/webp" },
    });
    if (!response.ok) throw new Error(`Image provider returned status ${response.status}.`);

    const contentType = response.headers.get("content-type")?.split(";")[0] || "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      throw new Error("Image provider returned an unsupported image format.");
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 5 * 1024 * 1024) {
      throw new Error("Generated background exceeded the 5MB image limit.");
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
      throw new Error("Generated background exceeded the 5MB image limit.");
    }
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function buildPosterSvg(event, completion, purpose) {
  const title = clean(event.title, 120) || "Campus Event";
  const category = clean(event.category, 48);
  const department = clean(event.department?.name || event.department_id?.name || event.department, 64);
  const organizer = clean(event.organization_name || event.requester_name, 72);
  const date = formatDate(event.start_date);
  const description = clean(event.description, 190);
  const recap = clean([
    completion?.key_highlights,
    completion?.event_outcomes,
    completion?.winners_achievements,
  ].filter(Boolean).join(" · "), 190);
  const isRecap = purpose === "completion";
  const palette = PALETTES[(category.length + title.length) % PALETTES.length];
  const [background, secondary, accent] = palette;
  const abstractBackground = await generateAbstractBackground(event, isRecap ? "event recap" : "event announcement");

  const details = [
    date && `DATE  ·  ${date}`,
    !isRecap && event.start_time && `TIME  ·  ${clean(event.start_time, 24)}`,
    event.venue && `VENUE  ·  ${clean(event.venue, 64)}`,
    (department || organizer) && `BY  ·  ${[organizer, department].filter(Boolean).join(" · ")}`,
  ].filter(Boolean);

  const titleLines = wrapText(title, 22, 3);
  const titleMarkup = titleLines.map((line, index) =>
    `<tspan x="76" dy="${index === 0 ? 0 : 74}">${xmlEscape(line)}</tspan>`
  ).join("");
  const bodyText = isRecap ? recap : description;
  const bodyMarkup = textBlock(bodyText, {
    x: 78, y: 506, size: 26, color: "#dbeafe", maxChars: 42, maxLines: 3, lineHeight: 38,
  });
  const detailsMarkup = details.map((line, index) =>
    textBlock(line, { x: 80, y: 690 + index * 48, size: 20, color: "#e2e8f0", maxChars: 48, maxLines: 1 })
  ).join("");
  const categoryMarkup = category
    ? textBlock(category.toUpperCase(), { x: 80, y: 176, size: 18, color: accent, weight: 700, maxChars: 40, maxLines: 1 })
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${background}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${accent}" stop-opacity=".9"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity=".2"/>
      </linearGradient>
      <filter id="soften"><feGaussianBlur stdDeviation="20"/></filter>
    </defs>
    <rect width="800" height="1000" rx="28" fill="url(#background)"/>
    <image href="${abstractBackground}" x="0" y="0" width="800" height="1000" preserveAspectRatio="xMidYMid slice" filter="url(#soften)" opacity=".28"/>
    <rect width="800" height="1000" rx="28" fill="url(#background)" opacity=".78"/>
    <circle cx="720" cy="120" r="230" fill="${accent}" opacity=".08"/>
    <path d="M0 860 Q400 720 800 860 V1000 H0Z" fill="#07111f" opacity=".18"/>
    <rect x="56" y="56" width="688" height="888" rx="22" fill="none" stroke="white" stroke-opacity=".18" stroke-width="2"/>
    <rect x="80" y="206" width="110" height="5" rx="3" fill="url(#accent)"/>
    ${categoryMarkup}
    <text x="76" y="324" fill="#ffffff" font-size="${titleLines.length > 2 ? 52 : 62}" font-weight="700" font-family="Arial, Helvetica, sans-serif">${titleMarkup}</text>
    ${bodyMarkup}
    <line x1="80" y1="650" x2="720" y2="650" stroke="white" stroke-opacity=".22"/>
    ${detailsMarkup}
    <text x="80" y="902" fill="${accent}" font-size="15" font-weight="700" letter-spacing="3" font-family="Arial, Helvetica, sans-serif">${isRecap ? "EVENT RECAP" : "CAMPUS EVENT"}</text>
  </svg>`;
}

export async function generateTextFocusedPoster(event, completion = null, purpose = "announcement") {
  const svg = await buildPosterSvg(event, completion, purpose);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const folder = purpose === "completion"
    ? "campus-connect/posters/event-recaps"
    : "campus-connect/posters/announcements";
  const url = await uploadImageToCloudinary(dataUri, folder);
  if (!url || url.startsWith("data:")) {
    throw new Error("Poster could not be saved. Check image storage configuration and try again.");
  }
  return url;
}

export const generatePoster1 = (event, completion) =>
  generateTextFocusedPoster(event, completion, completion ? "completion" : "announcement");

export const generatePoster2 = async (event, completion) => ({
  activityPosterUrl: await generateTextFocusedPoster(event, completion, "completion"),
  prompt: "Text-focused event recap poster built from the supplied event and completion details.",
});

export async function generateAIPoster(event, completion) {
  const posterUrl = await generateTextFocusedPoster(event, completion, "completion");
  return {
    posterUrl,
    activityPosterUrl: posterUrl,
    prompt: "Text-focused event recap poster built from the supplied event and completion details.",
  };
}
