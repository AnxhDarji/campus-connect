import * as instagramService from "../services/instagramAuthService.js";

const redirectUri = () => process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:5001/api/instagram/callback";
const frontendUrl = () => process.env.CLIENT_URL || "http://localhost:5174";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/instagram/callback", maxAge: 10 * 60 * 1000 };

export const initiate = (req, res, next) => {
  try {
    const { url, nonce } = instagramService.getAuthorizationUrl(req.user.id, redirectUri());
    res.cookie("instagram_oauth_nonce", nonce, cookieOptions);
    res.redirect(url);
  } catch (error) { next(error); }
};

export const callback = async (req, res) => {
  res.clearCookie("instagram_oauth_nonce", { ...cookieOptions, maxAge: undefined });
  try {
    if (req.query.error) throw new Error("Instagram authorization was declined.");
    const userId = instagramService.verifyState(req.query.state, req.cookies?.instagram_oauth_nonce);
    if (!req.query.code) throw new Error("Instagram did not return an authorization code.");
    await instagramService.completeAuthorization({ code: req.query.code, redirectUri: redirectUri(), userId });
    res.redirect(`${frontendUrl()}/profile?instagram=connected`);
  } catch {
    res.redirect(`${frontendUrl()}/profile?instagram=error`);
  }
};

export const getAccount = async (req, res, next) => {
  try {
    const account = await instagramService.getConnectedAccount(req.user.id);
    res.json({ success: true, account: account ? { platform: "Instagram", username: account.username, connected: true, connectedAt: account.createdAt } : null });
  } catch (error) { next(error); }
};

export const disconnect = async (req, res, next) => {
  try {
    await instagramService.disconnectAccount(req.user.id);
    res.json({ success: true, message: "Instagram account disconnected." });
  } catch (error) { next(error); }
};

// POST /api/instagram/connect-token  (dev/test only — INSTAGRAM_DEV_TOKEN_ENABLED=true)
export const connectWithToken = async (req, res, next) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ success: false, message: "access_token is required." });
    const account = await instagramService.connectWithToken(req.user.id, access_token);
    res.json({ success: true, message: "Instagram account connected via token.", account: { username: account.username, connectedAt: account.createdAt } });
  } catch (error) { next(error); }
};
