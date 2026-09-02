import mongoose from "mongoose";
import EventRequest from "../models/EventRequest.js";
import EventCompletion from "../models/EventCompletion.js";
import EventReport from "../models/EventReport.js";
import { getLifecycleStatus } from "../utils/eventLifecycle.js";
import { generateAndStoreReport } from "../services/eventReportService.js";

const ADMIN_ROLES = ["Super Admin", "Admin", "Dept Admin"];

function isAuthorized(event, userId, userRole) {
  if (ADMIN_ROLES.includes(userRole)) return true;
  return event.submitted_by.toString() === userId.toString();
}

// GET /api/event-requests/:id/completion
export const getCompletion = async (req, res, next) => {
  try {
    const event = await EventRequest.findOne({ _id: req.params.id, is_deleted: false })
      .populate("department_id", "name code");

    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const lifecycle = getLifecycleStatus(event);

    // Return null lifecycle gracefully for non-approved events
    if (!lifecycle) {
      return res.json({
        success: true,
        data: {
          event: { _id: event._id, title: event.title },
          lifecycle_status: null,
          completion: null,
          report: null,
        },
      });
    }

    const completion = await EventCompletion.findOne({ event_id: event._id });
    const report = await EventReport.findOne({ event_id: event._id });

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          category: event.category,
          department: event.department_id,
          venue: event.venue,
          building: event.building,
          room: event.room,
          start_date: event.start_date,
          end_date: event.end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          requester_name: event.requester_name,
          organization_name: event.organization_name,
          description: event.description,
          poster_url: event.poster_url,
        },
        lifecycle_status: lifecycle,
        completion: completion || null,
        report: report
          ? {
              _id: report._id,
              generation_status: report.generation_status,
              report_data: report.report_data,
              generated_at: report.generated_at,
              error_message: report.generation_status === "FAILED" ? report.error_message : null,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/event-requests/:id/completion
export const submitCompletion = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const event = await EventRequest.findOne({ _id: req.params.id, is_deleted: false }).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    if (!isAuthorized(event, req.user.id, req.user.role)) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "You are not authorized to complete this event." });
    }

    const lifecycle = getLifecycleStatus(event);
    if (lifecycle !== "AWAITING_COMPLETION") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: lifecycle === "COMPLETED"
          ? "This event has already been completed."
          : `Event is not eligible for completion. Current status: ${lifecycle}`,
      });
    }

    // Duplicate submission protection
    const existing = await EventCompletion.findOne({ event_id: event._id }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Completion has already been submitted for this event." });
    }

    // Validate attendance
    const attendance = parseInt(req.body.actual_attendance, 10);
    if (isNaN(attendance) || attendance < 0 || attendance > 100000) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Actual attendance must be an integer between 0 and 100000." });
    }

    // Collect uploaded photo paths
    const photos = (req.files || []).map((f) => `/uploads/events/${f.filename}`);

    // Save completion
    const [completion] = await EventCompletion.create(
      [
        {
          event_id: event._id,
          actual_attendance: attendance,
          key_highlights: req.body.key_highlights?.trim() || null,
          winners_achievements: req.body.winners_achievements?.trim() || null,
          special_guests: req.body.special_guests?.trim() || null,
          event_outcomes: req.body.event_outcomes?.trim() || null,
          photos,
          submitted_by: req.user.id,
        },
      ],
      { session }
    );

    // Mark event as COMPLETED
    event.completion_status = "COMPLETED";
    await event.save({ session });

    await session.commitTransaction();

    // Trigger AI report generation AFTER transaction — failure must not affect completion
    generateAndStoreReport(event._id).catch(() => {
      // Intentionally swallowed — report failure is independent
    });

    res.status(201).json({
      success: true,
      message: "Event completion submitted successfully.",
      data: { completion_id: completion._id, lifecycle_status: "COMPLETED" },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// POST /api/event-requests/:id/report/retry
export const retryReportGeneration = async (req, res, next) => {
  try {
    const event = await EventRequest.findOne({ _id: req.params.id, is_deleted: false });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (!isAuthorized(event, req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (event.completion_status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Event is not completed yet." });
    }

    const report = await EventReport.findOne({ event_id: event._id });
    if (report?.generation_status === "GENERATED") {
      return res.status(400).json({ success: false, message: "Report has already been generated." });
    }

    // Fire and forget — respond immediately
    generateAndStoreReport(event._id).catch(() => {});

    res.json({ success: true, message: "Report generation started." });
  } catch (err) {
    next(err);
  }
};
