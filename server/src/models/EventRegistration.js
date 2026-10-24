import mongoose from "mongoose";
import crypto from "crypto";

const eventRegistrationSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRequest",
      required: true,
      index: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    registration_status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    // Raw token returned to student once; hash stored here
    qr_token_hash: {
      type: String,
      required: true,
      unique: true,
    },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null },
  },
  { timestamps: { createdAt: "registered_at", updatedAt: "updated_at" } }
);

// One student can register for an event only once
eventRegistrationSchema.index({ event_id: 1, student_id: 1 }, { unique: true });

// Static helper: generate a raw token and its SHA-256 hash
eventRegistrationSchema.statics.generateToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

// Static helper: hash an incoming raw token for lookup
eventRegistrationSchema.statics.hashToken = function (raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const EventRegistration = mongoose.model("EventRegistration", eventRegistrationSchema);
export default EventRegistration;
