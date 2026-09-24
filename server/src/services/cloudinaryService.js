import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads an image (file path, base64 URL, or remote HTTP URL) to Cloudinary or falls back to local disk storage.
 * @param {string} filePathOrBase64 - Absolute file path, base64 data URI, or remote HTTP URL
 * @param {string} folder - Target folder tag
 * @returns {Promise<string>} - Cloudinary URL or local relative path (/uploads/events/...)
 */
export async function uploadImageToCloudinary(filePathOrBase64, folder = "campus-connect/posters") {
  if (!filePathOrBase64) return null;

  if (isCloudinaryConfigured()) {
    try {
      let uploadTarget = filePathOrBase64;
      if (filePathOrBase64.startsWith("http")) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(filePathOrBase64, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
          });
          clearTimeout(timeout);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            uploadTarget = `data:image/jpeg;base64,${Buffer.from(ab).toString("base64")}`;
          }
        } catch (fetchErr) {
          console.warn("Pre-fetch buffer for Cloudinary failed, attempting direct URL upload:", fetchErr.message);
        }
      }

      const result = await cloudinary.uploader.upload(uploadTarget, {
        folder,
        resource_type: "image",
      });
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Local fallback storage logic for base64
  if (filePathOrBase64.startsWith("data:image")) {
    try {
      const base64Data = filePathOrBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `poster-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
      const targetDir = path.join(process.cwd(), "uploads", "events");
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, filename);
      fs.writeFileSync(targetPath, buffer);
      return `/uploads/events/${filename}`;
    } catch (e) {
      console.error("Local base64 save error:", e.message);
    }
  }

  // Local fallback storage logic for remote HTTP URL with timeout
  if (filePathOrBase64.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
      const res = await fetch(filePathOrBase64, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });
      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("image")) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = `poster-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const targetDir = path.join(process.cwd(), "uploads", "events");
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, filename);
        fs.writeFileSync(targetPath, buffer);
        return `/uploads/events/${filename}`;
      } else {
        console.warn(`Remote image download returned non-image content (${contentType}) or status ${res.status}`);
      }
    } catch (e) {
      console.error("Remote image fetch failed or timed out, returning direct URL:", e.message);
    }
  }

  return filePathOrBase64;
}
