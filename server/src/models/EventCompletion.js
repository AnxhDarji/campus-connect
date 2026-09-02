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
  },
  { timestamps: { createdAt: "submitted_at", updatedAt: "updated_at" } }
);

const EventCompletion = mongoose.model("EventCompletion", eventCompletionSchema);
export default EventCompletion;
