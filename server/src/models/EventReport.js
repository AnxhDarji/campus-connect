import mongoose from "mongoose";

const reportDataSchema = new mongoose.Schema(
  {
    eventOverview: { type: String, default: null },
    participationSummary: { type: String, default: null },
    keyHighlights: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    eventOutcomes: { type: [String], default: [] },
    conclusion: { type: String, default: null },
  },
  { _id: false }
);

const eventReportSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRequest",
      required: true,
      unique: true, // one report per event
    },
    completion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCompletion",
      required: true,
    },
    report_data: { type: reportDataSchema, default: null },
    generation_status: {
      type: String,
      enum: ["NOT_GENERATED", "GENERATING", "GENERATED", "FAILED"],
      default: "NOT_GENERATED",
    },
    error_message: { type: String, default: null },
    generated_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const EventReport = mongoose.model("EventReport", eventReportSchema);
export default EventReport;
