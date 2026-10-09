/**
 * Token encryption/decryption for stored Instagram access tokens.
 * Uses AES-256-GCM. Key must be a base64-encoded 32-byte value in
 * INSTAGRAM_TOKEN_ENCRYPTION_KEY (same key used by instagramAuthService).
 */

import crypto from "node:crypto";

function encryptionKey() {
  const raw = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("INSTAGRAM_TOKEN_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("INSTAGRAM_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function decryptToken(encrypted) {
  const parts = encrypted.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format.");
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ct = Buffer.from(ctB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
