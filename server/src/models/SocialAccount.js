import mongoose from "mongoose";

const socialAccountSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["instagram"], required: true, default: "instagram" },
  providerUserId: { type: String, required: true },
  username: { type: String, required: true },
  accountType: { type: String, default: null },
  encryptedAccessToken: { type: String, required: true, select: false },
  tokenExpiresAt: { type: Date, default: null },
}, { timestamps: true });

socialAccountSchema.index({ owner: 1, provider: 1 }, { unique: true });

export default mongoose.model("SocialAccount", socialAccountSchema);
