import mongoose from "mongoose";

const socialPostDraftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRequest", required: true, index: true },
    socialAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount", default: null },
    postType: { type: String, enum: ["EVENT_PROMOTION", "EVENT_RESULT"], required: true },
    sourceType: {
      type: String,
      enum: ["USER_UPLOADED", "EVENT_POSTER", "AI_GENERATED_POSTER", "EVENT_COMPLETION_PHOTO"],
      default: "EVENT_POSTER",
    },
    posterUrl: { type: String, default: null },
    caption: { type: String, default: null },
    hashtags: { type: [String], default: [] },
    finalCaption: { type: String, default: null },
    generatedByAI: { type: Boolean, default: false },
    aiModel: { type: String, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "GENERATING", "READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED"],
      default: "DRAFT",
    },
    scheduledAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

socialPostDraftSchema.index({ userId: 1, eventId: 1, postType: 1 });

export default mongoose.model("SocialPostDraft", socialPostDraftSchema);
