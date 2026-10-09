/**
 * Resolves a stored media URL to a publicly accessible HTTPS URL suitable
 * for the Instagram Graph API.
 *
 * Local /uploads/... paths are handled upstream in socialPostService by
 * auto-uploading to Cloudinary before this function is called.
 * This function is the final safety net.
 */

import { isMockMode } from "../instagram/instagramProvider.js";

export function resolveSocialMediaUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error("No image selected for this draft. Please select or upload a poster first.");
  }

  // Already a public HTTPS URL (Cloudinary, etc.) — ideal
  if (rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  // Local path — in mock mode we allow it (no real API call is made)
  if (rawUrl.startsWith("/uploads/") || rawUrl.startsWith("uploads/")) {
    if (isMockMode()) {
      const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`;
      return `${base}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
    }
    // In real mode this should have been resolved to Cloudinary upstream.
    // If we still get here it means Cloudinary is not configured.
    throw new Error(
      "This image is stored locally. Please configure Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) so images are automatically uploaded to a public URL before publishing to Instagram."
    );
  }

  // data: URI — never acceptable for Meta
  if (rawUrl.startsWith("data:")) {
    throw new Error("Base64 data URIs cannot be published to Instagram. The image must be uploaded to Cloudinary first.");
  }

  // http:// — Meta requires HTTPS in real mode
  if (rawUrl.startsWith("http://")) {
    if (isMockMode()) return rawUrl;
    throw new Error("Instagram requires a public HTTPS image URL. The current URL uses HTTP.");
  }

  throw new Error(`Unsupported media URL format. Please re-upload the image.`);
}
