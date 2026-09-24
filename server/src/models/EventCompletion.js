import mongoose from "mongoose";

const eventCompletionSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRequest",
      required: true,
      unique: true, // one completion per event
    },
    actual_attendance: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
    key_highlights: { type: String, trim: true, default: null },
    winners_achievements: { type: String, trim: true, default: null },
    special_guests: { type: String, trim: true, default: null },
    event_outcomes: { type: String, trim: true, default: null },
    photos: { type: [String], default: [] }, // array of /uploads/events/... paths
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // AI Poster & Review Workflow fields
    ai_generation_status: {
      type: String,
      enum: ["NOT_GENERATED", "GENERATING", "GENERATED", "APPROVED", "REGENERATE", "GENERATION_FAILED"],
      default: "NOT_GENERATED",
    },
    generated_poster_url: { type: String, default: null },
    generated_activity_poster_url: { type: String, default: null },
    generation_prompt: { type: String, default: null },
    review_status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewed_at: { type: Date, default: null },
    review_notes: { type: String, trim: true, default: null },
  },
  { timestamps: { createdAt: "submitted_at", updatedAt: "updated_at" } }
);

const EventCompletion = mongoose.model("EventCompletion", eventCompletionSchema);
export default EventCompletion;
