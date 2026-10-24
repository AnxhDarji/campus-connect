import mongoose from "mongoose";

const eventAttendanceSchema = new mongoose.Schema(
  {
    registration_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
      unique: true, // one attendance record per registration
    },
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
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },
    checked_in_at: { type: Date, default: null },
    checked_in_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const EventAttendance = mongoose.model("EventAttendance", eventAttendanceSchema);
export default EventAttendance;
