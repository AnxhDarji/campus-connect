import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadImageToCloudinary } from "./cloudinaryService.js";

/**
 * Builds a dynamic photorealistic scene prompt tailored to the event content.
 */
function buildPhotorealisticPrompt(event, completion) {
  const title = event.title || "Campus Event";
  const category = event.category || "General";
  const desc = event.description || "";
  const cleanDesc = desc.replace(/[\n\r]/g, " ").substring(0, 150);

  const titleLower = (title + " " + desc).toLowerCase();

  let actionKeywords = "participating actively in the event activity, interacting together";
  if (titleLower.includes("cricket") || titleLower.includes("match")) {
    actionKeywords = "playing an intense cricket match on outdoor sports ground, batsman playing shot, bowlers and fielders in action";
  } else if (titleLower.includes("football") || titleLower.includes("soccer")) {
    actionKeywords = "playing energetic football match on green turf under stadium lights, kicking soccer ball";
  } else if (titleLower.includes("hackathon") || titleLower.includes("code") || titleLower.includes("coding")) {
    actionKeywords = "collaborating in a modern computer science innovation lab, working together on laptops with code on dual monitors, python and github posters";
  } else if (titleLower.includes("dance") || titleLower.includes("garba") || titleLower.includes("sing") || titleLower.includes("music") || titleLower.includes("cultural")) {
    actionKeywords = "performing energetic dance/music performance on stage under stage spotlights, cheering festival audience in background";
  } else if (titleLower.includes("workshop") || titleLower.includes("seminar") || titleLower.includes("conference")) {
    actionKeywords = "attending an interactive workshop session in a modern college auditorium, speaker presenting slides at podium";
  }

  return `photorealistic 8k photo of university college students during a ${category} event titled "${title}". ${actionKeywords}. ${cleanDesc}. Authentic expressions, dynamic composition, high quality DSLR camera photo`;
}

/**
 * Generates a colorful promotional SVG layout for Official Poster 1.
 */
function buildOfficialSVG(category, title, palette) {
  const palettes = [
    ["#0f172a", "#1e1b4b", "#3b82f6"],
    ["#1e293b", "#0f766e", "#14b8a6"],
    ["#312e81", "#4338ca", "#6366f1"],
    ["#4c0519", "#881337", "#f43f5e"],
  ];
  
  const chosen = palette || palettes[Math.floor(Math.random() * palettes.length)];
  const c1 = chosen[0];
  const c2 = chosen[1];
  const c3 = chosen[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <defs>
      <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="50%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c1}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${c3}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#mainBg)"/>
    <rect width="800" height="1000" fill="url(#glow)"/>
    <circle cx="400" cy="380" r="280" fill="${c3}" opacity="0.12"/>
    <path d="M -100 250 Q 400 50 900 250 M -100 750 Q 400 950 900 750" stroke="${c3}" stroke-width="3" opacity="0.25" fill="none"/>
  </svg>`;
}

/**
 * Generates ONLY Poster 1 (Official Promotional Graphic)
 */
export async function generatePoster1(event, completion) {
  const svg1 = buildOfficialSVG(event.category, event.title);
  const dataUri1 = `data:image/svg+xml;base64,${Buffer.from(svg1).toString("base64")}`;
  const posterUrl = await uploadImageToCloudinary(dataUri1, "campus-connect/posters/official");
  return posterUrl || dataUri1;
}

/**
 * Generates ONLY Poster 2 (Photorealistic Event Action Visual)
 */
export async function generatePoster2(event, completion) {
  let photoPrompt = buildPhotorealisticPrompt(event, completion);

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const geminiPrompt = `Analyze this event:
Title: "${event.title}"
Category: "${event.category}"
Description: "${event.description || ""}"

Describe a photorealistic 8K photo scene showing students performing this specific activity. Return ONLY JSON: {"photorealistic_scene_prompt": "description..."}`;

      const result = await model.generateContent(geminiPrompt);
      const text = result.response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        if (parsed.photorealistic_scene_prompt && parsed.photorealistic_scene_prompt.length > 20) {
          photoPrompt = `photorealistic 8k photo, ${parsed.photorealistic_scene_prompt}, high quality DSLR photo`;
        }
      }
    } catch {
      // Fallback to buildPhotorealisticPrompt
    }
  }

  // Ensure seed is ALWAYS a valid positive integer <= 2000000000
  const validSeed = Math.floor(Math.random() * 2000000000);
  const photorealisticImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(photoPrompt)}?model=flux&width=800&height=1000&seed=${validSeed}&nologo=true`;

  const activityPosterUrl = await uploadImageToCloudinary(photorealisticImageUrl, "campus-connect/posters/activity");

  return {
    activityPosterUrl: activityPosterUrl || photorealisticImageUrl,
    prompt: photoPrompt,
  };
}

/**
 * Generates BOTH initial AI posters (Poster 1 + Poster 2)
 */
export async function generateAIPoster(event, completion) {
  const [posterUrl, poster2Result] = await Promise.all([
    generatePoster1(event, completion),
    generatePoster2(event, completion),
  ]);

  return {
    posterUrl,
    activityPosterUrl: poster2Result.activityPosterUrl,
    prompt: poster2Result.prompt,
  };
}
