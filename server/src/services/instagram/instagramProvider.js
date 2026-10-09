/**
 * Instagram Provider Abstraction
 *
 * META_SOCIAL_MODE=mock  → InstagramMockProvider (no real API calls)
 * META_SOCIAL_MODE=real  → InstagramRealProvider (official Meta Graph API)
 *
 * Interface:
 *   createMediaContainer(token, igUserId, imageUrl, caption) → { containerId }
 *   checkContainerStatus(token, containerId)                 → { status }
 *   publishContainer(token, igUserId, containerId)           → { mediaId, isMock? }
 */

import crypto from "node:crypto";

const GRAPH = "https://graph.instagram.com/v21.0";

async function parseGraph(res) {
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data.error?.message || "Instagram API error";
    const err = new Error(msg);
    err.code = String(data.error?.code || data.error?.error_subcode || res.status);
    throw err;
  }
  return data;
}

export const InstagramRealProvider = {
  async createMediaContainer(token, igUserId, imageUrl, caption) {
    const res = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const data = await parseGraph(res);
    return { containerId: data.id };
  },

  async checkContainerStatus(token, containerId) {
    const url = new URL(`${GRAPH}/${containerId}`);
    url.searchParams.set("fields", "status_code,status");
    url.searchParams.set("access_token", token);
    const data = await parseGraph(await fetch(url));
    return { status: data.status_code || data.status };
  },

  async publishContainer(token, igUserId, containerId) {
    const res = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: token }),
    });
    const data = await parseGraph(res);
    return { mediaId: data.id, isMock: false };
  },
};

export const InstagramMockProvider = {
  async createMediaContainer(_token, _igUserId, _imageUrl, _caption) {
    await delay(300);
    return { containerId: `MOCK_CONTAINER_${crypto.randomBytes(6).toString("hex").toUpperCase()}` };
  },

  async checkContainerStatus(_token, _containerId) {
    await delay(200);
    return { status: "FINISHED" };
  },

  async publishContainer(_token, _igUserId, _containerId) {
    await delay(400);
    return { mediaId: `MOCK_MEDIA_${crypto.randomBytes(8).toString("hex").toUpperCase()}`, isMock: true };
  },
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function getInstagramProvider() {
  return (process.env.META_SOCIAL_MODE || "mock").toLowerCase() === "real"
    ? InstagramRealProvider
    : InstagramMockProvider;
}

export function isMockMode() {
  return (process.env.META_SOCIAL_MODE || "mock").toLowerCase() !== "real";
}
