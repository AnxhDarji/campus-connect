import mongoose from "mongoose";

const socialPublishingRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRequest", required: true },
    socialAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount", required: true },
    draftId: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPostDraft", required: true, index: true },
    provider: { type: String, enum: ["instagram"], required: true },
    postType: { type: String, enum: ["EVENT_PROMOTION", "EVENT_RESULT"], required: true },
    mediaUrl: { type: String, required: true },
    caption: { type: String, required: true },
    hashtags: { type: [String], default: [] },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHING", "PUBLISHED", "FAILED"],
      default: "PENDING",
    },
    isMock: { type: Boolean, default: false },
    providerContainerId: { type: String, default: null },
    providerMediaId: { type: String, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent duplicate publish of the same draft
socialPublishingRecordSchema.index({ draftId: 1, status: 1 });

export default mongoose.model("SocialPublishingRecord", socialPublishingRecordSchema);
