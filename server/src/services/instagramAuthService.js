import crypto from "node:crypto";
import SocialAccount from "../models/SocialAccount.js";

const AUTH_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_URL = "https://graph.instagram.com";
const SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

const encryptionKey = () => {
  const key = Buffer.from(requiredEnv("INSTAGRAM_TOKEN_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("INSTAGRAM_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
};

const encryptToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
};

const makeState = (userId, nonce) => {
  const payload = Buffer.from(JSON.stringify({ userId: String(userId), nonce, exp: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", requiredEnv("JWT_SECRET")).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

export const verifyState = (state, nonce) => {
  if (!state || !nonce) throw new Error("Instagram authorization state is missing.");
  const [payload, signature, ...extra] = state.split(".");
  if (!payload || !signature || extra.length) throw new Error("Instagram authorization state is invalid.");
  const expected = crypto.createHmac("sha256", requiredEnv("JWT_SECRET")).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, "base64url"); } catch { throw new Error("Instagram authorization state is invalid."); }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error("Instagram authorization state is invalid.");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp < Date.now() || data.nonce !== nonce) throw new Error("Instagram authorization state expired or does not match this browser.");
  return data.userId;
};

export const getAuthorizationUrl = (userId, redirectUri) => {
  const nonce = crypto.randomBytes(32).toString("base64url");
  const state = makeState(userId, nonce);
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({ client_id: requiredEnv("INSTAGRAM_APP_ID"), redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(","), state }).toString();
  return { url: url.toString(), nonce };
};

const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error_message || data.error?.message || "Instagram authorization failed.");
  return data;
};

export const completeAuthorization = async ({ code, redirectUri, userId }) => {
  const body = new URLSearchParams({ client_id: requiredEnv("INSTAGRAM_APP_ID"), client_secret: requiredEnv("INSTAGRAM_APP_SECRET"), grant_type: "authorization_code", redirect_uri: redirectUri, code });
  const shortLived = await parseResponse(await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }));
  if (!shortLived.access_token) throw new Error("Instagram did not return an access token.");

  const longUrl = new URL(`${GRAPH_URL}/access_token`);
  longUrl.search = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: requiredEnv("INSTAGRAM_APP_SECRET"), access_token: shortLived.access_token }).toString();
  const longLived = await parseResponse(await fetch(longUrl));
  const accessToken = longLived.access_token;
  if (!accessToken) throw new Error("Instagram did not return a long-lived access token.");

  const meUrl = new URL(`${GRAPH_URL}/me`);
  meUrl.search = new URLSearchParams({ fields: "user_id,username,account_type", access_token: accessToken }).toString();
  const account = await parseResponse(await fetch(meUrl));
  const providerUserId = account.user_id || account.id;
  if (!providerUserId || !account.username) throw new Error("Instagram did not return the account identity.");

  return SocialAccount.findOneAndUpdate(
    { owner: userId, provider: "instagram" },
    { owner: userId, provider: "instagram", providerUserId: String(providerUserId), username: account.username, accountType: account.account_type || null, encryptedAccessToken: encryptToken(accessToken), tokenExpiresAt: longLived.expires_in ? new Date(Date.now() + longLived.expires_in * 1000) : null },
    { upsert: true, new: true, runValidators: true, projection: { username: 1, providerUserId: 1, accountType: 1, createdAt: 1 } },
  );
};

export const getConnectedAccount = (userId) => SocialAccount.findOne({ owner: userId, provider: "instagram" }).select("username providerUserId accountType createdAt").lean();
export const disconnectAccount = (userId) => SocialAccount.findOneAndDelete({ owner: userId, provider: "instagram" });

/**
 * Dev/test shortcut: store a pre-generated access token directly.
 * Fetches account info from the Graph API using the provided token,
 * then encrypts and stores it exactly like the OAuth flow.
 * Only available when INSTAGRAM_DEV_TOKEN_ENABLED=true.
 */
export const connectWithToken = async (userId, accessToken) => {
  if (process.env.INSTAGRAM_DEV_TOKEN_ENABLED !== "true") {
    throw new Error("Direct token connection is not enabled.");
  }

  const meUrl = new URL(`${GRAPH_URL}/me`);
  meUrl.search = new URLSearchParams({ fields: "user_id,username,account_type", access_token: accessToken }).toString();
  const account = await parseResponse(await fetch(meUrl));
  const providerUserId = account.user_id || account.id;
  if (!providerUserId || !account.username) throw new Error("Token is invalid or does not have the required permissions.");

  return SocialAccount.findOneAndUpdate(
    { owner: userId, provider: "instagram" },
    {
      owner: userId,
      provider: "instagram",
      providerUserId: String(providerUserId),
      username: account.username,
      accountType: account.account_type || null,
      encryptedAccessToken: encryptToken(accessToken),
      tokenExpiresAt: null,
    },
    { upsert: true, new: true, runValidators: true, projection: { username: 1, providerUserId: 1, accountType: 1, createdAt: 1 } },
  );
};
