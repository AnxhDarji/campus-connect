import mongoose from "mongoose";
import QRCode from "qrcode";
import EventRequest from "../models/EventRequest.js";
import EventRegistration from "../models/EventRegistration.js";
import EventAttendance from "../models/EventAttendance.js";
import User from "../models/User.js";
import { getLifecycleStatus } from "../utils/eventLifecycle.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function resolveEvent(eventMongoId) {
  const event = await EventRequest.findOne({
    _id: eventMongoId,
    is_deleted: false,
  });
  if (!event) throw makeError("Event not found.", 404);
  return event;
}

// ── REGISTER FOR EVENT ───────────────────────────────────────────────────────

export async function registerForEvent({ eventId, studentId }) {
  const event = await resolveEvent(eventId);

  if (!["Approved", "Published"].includes(event.status)) {
    throw makeError("This event is not open for registration.", 400);
  }

  const lifecycle = getLifecycleStatus(event);
  if (lifecycle === "AWAITING_COMPLETION" || lifecycle === "COMPLETED") {
    throw makeError("Registration for this event has closed.", 400);
  }

  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    throw makeError("The registration deadline has passed.", 400);
  }

  // Capacity check (if capacity is set)
  if (event.capacity && event.capacity > 0) {
    const confirmed = await EventRegistration.countDocuments({
      event_id: eventId,
      registration_status: "confirmed",
    });
    if (confirmed >= event.capacity) {
      throw makeError("This event has reached its capacity.", 409);
    }
  }

  // Generate token before insert to avoid partial state
  const { raw, hash } = EventRegistration.generateToken();

  // Atomic insert — unique index on (event_id, student_id) prevents duplicates
  let registration;
  try {
    registration = await EventRegistration.create({
      event_id: eventId,
      student_id: studentId,
      qr_token_hash: hash,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Check if it's a duplicate registration or duplicate hash collision
      const existing = await EventRegistration.findOne({
        event_id: eventId,
        student_id: studentId,
      });
      if (existing) {
        throw makeError("You are already registered for this event.", 409);
      }
      throw makeError("Registration failed due to a conflict. Please try again.", 409);
    }
    throw err;
  }

  // Generate QR image as data URL (base64 PNG)
  const qrDataUrl = await QRCode.toDataURL(raw, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });

  return {
    registration_id: registration._id,
    raw_token: raw,
    qr_data_url: qrDataUrl,
    registered_at: registration.registered_at,
  };
}

// ── GET STUDENT'S REGISTRATION FOR AN EVENT ──────────────────────────────────

export async function getMyRegistration({ eventId, studentId }) {
  const registration = await EventRegistration.findOne({
    event_id: eventId,
    student_id: studentId,
  });
  if (!registration) return null;

  // Re-generate QR from stored hash is impossible — we must store raw token
  // Instead: return registration metadata; QR is fetched via separate endpoint
  return registration;
}

// ── GET QR PASS (returns raw token so frontend can render QR) ────────────────

export async function getQRPass({ eventId, studentId }) {
  const registration = await EventRegistration.findOne({
    event_id: eventId,
    student_id: studentId,
    registration_status: "confirmed",
  });
  if (!registration) throw makeError("No confirmed registration found.", 404);

  // We cannot recover the raw token from the hash.
  // Solution: store the raw token encrypted, OR re-issue a stable token.
  // We use a deterministic HMAC so the same student+registration always
  // produces the same scannable token without storing the raw value.
  // The HMAC key is the server's JWT_SECRET — never exposed to clients.
  const { createHmac } = await import("crypto");
  const stableToken = createHmac("sha256", process.env.JWT_SECRET)
    .update(registration._id.toString())
    .digest("hex");

  // Update hash to match this stable token (idempotent on first call)
  const expectedHash = EventRegistration.hashToken(stableToken);
  if (registration.qr_token_hash !== expectedHash) {
    registration.qr_token_hash = expectedHash;
    await registration.save();
  }

  const qrDataUrl = await QRCode.toDataURL(stableToken, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });

  const event = await EventRequest.findById(eventId).select("title start_date start_time venue").lean();
  const student = await User.findById(studentId).select("fullName institutionId").lean();

  return {
    registration_id: registration._id,
    registered_at: registration.registered_at,
    registration_status: registration.registration_status,
    qr_data_url: qrDataUrl,
    event: event
      ? { title: event.title, start_date: event.start_date, start_time: event.start_time, venue: event.venue }
      : null,
    student: student
      ? { fullName: student.fullName, institutionId: student.institutionId }
      : null,
  };
}

// ── VERIFY QR AND MARK ATTENDANCE ────────────────────────────────────────────

export async function verifyAndMarkAttendance({ token, eventId, organizerId }) {
  if (!token || typeof token !== "string" || token.length < 10) {
    throw makeError("Invalid QR code.", 400);
  }

  const event = await resolveEvent(eventId);

  // Verify organizer owns this event
  const ownerId =
    typeof event.submitted_by === "object"
      ? event.submitted_by.toString()
      : event.submitted_by;
  if (ownerId !== organizerId.toString()) {
    throw makeError("You are not authorized to manage this event.", 403);
  }

  if (event.status === "Rejected" || event.is_deleted) {
    throw makeError("This event is cancelled or unavailable.", 400);
  }

  // Hash the incoming token and look up registration
  const tokenHash = EventRegistration.hashToken(token);
  const registration = await EventRegistration.findOne({
    qr_token_hash: tokenHash,
  }).populate("student_id", "fullName institutionId email");

  if (!registration) {
    throw makeError("QR code not recognised. Registration not found.", 404);
  }

  // Verify the registration belongs to this event
  if (registration.event_id.toString() !== eventId.toString()) {
    throw makeError("This QR code belongs to a different event.", 400);
  }

  if (registration.registration_status === "cancelled") {
    throw makeError("This registration has been cancelled.", 400);
  }

  const student = registration.student_id;

  // Check for existing attendance — use findOneAndUpdate for atomicity
  const existing = await EventAttendance.findOne({
    registration_id: registration._id,
  });

  if (existing) {
    return {
      already_marked: true,
      student: {
        fullName: student.fullName,
        institutionId: student.institutionId,
      },
      checked_in_at: existing.checked_in_at,
      status: existing.status,
    };
  }

  // Atomic insert — unique index on registration_id prevents race conditions
  let attendance;
  try {
    attendance = await EventAttendance.create({
      registration_id: registration._id,
      event_id: eventId,
      student_id: registration.student_id._id,
      status: "present",
      checked_in_at: new Date(),
      checked_in_by: organizerId,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition: another scan just beat us
      const race = await EventAttendance.findOne({ registration_id: registration._id });
      return {
        already_marked: true,
        student: { fullName: student.fullName, institutionId: student.institutionId },
        checked_in_at: race?.checked_in_at ?? new Date(),
        status: "present",
      };
    }
    throw err;
  }

  return {
    already_marked: false,
    student: {
      fullName: student.fullName,
      institutionId: student.institutionId,
    },
    checked_in_at: attendance.checked_in_at,
    status: "present",
  };
}

// ── GET ATTENDANCE STATS ──────────────────────────────────────────────────────

export async function getAttendanceStats({ eventId, organizerId }) {
  const event = await resolveEvent(eventId);
  const ownerId =
    typeof event.submitted_by === "object"
      ? event.submitted_by.toString()
      : event.submitted_by;
  if (ownerId !== organizerId.toString()) {
    throw makeError("Access denied.", 403);
  }

  const [confirmed, cancelled, presentCount] = await Promise.all([
    EventRegistration.countDocuments({ event_id: eventId, registration_status: "confirmed" }),
    EventRegistration.countDocuments({ event_id: eventId, registration_status: "cancelled" }),
    EventAttendance.countDocuments({ event_id: eventId, status: "present" }),
  ]);

  const absent = confirmed - presentCount;
  const percentage = confirmed > 0 ? Math.round((presentCount / confirmed) * 100) : 0;

  return { confirmed, cancelled, present: presentCount, absent, percentage };
}

// ── GET REGISTRATIONS LIST ────────────────────────────────────────────────────

export async function getRegistrationsList({ eventId, organizerId, page = 1, limit = 50, search = "" }) {
  const event = await resolveEvent(eventId);
  const ownerId =
    typeof event.submitted_by === "object"
      ? event.submitted_by.toString()
      : event.submitted_by;
  if (ownerId !== organizerId.toString()) {
    throw makeError("Access denied.", 403);
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Build student filter if search provided
  let studentIds = null;
  if (search) {
    const students = await User.find({
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { institutionId: { $regex: search, $options: "i" } },
      ],
    }).select("_id").lean();
    studentIds = students.map((s) => s._id);
  }

  const regQuery = { event_id: eventId };
  if (studentIds) regQuery.student_id = { $in: studentIds };

  const [registrations, total] = await Promise.all([
    EventRegistration.find(regQuery)
      .populate("student_id", "fullName institutionId email")
      .sort({ registered_at: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    EventRegistration.countDocuments(regQuery),
  ]);

  // Fetch attendance for these registrations
  const regIds = registrations.map((r) => r._id);
  const attendances = await EventAttendance.find({
    registration_id: { $in: regIds },
  }).lean();
  const attendanceMap = {};
  attendances.forEach((a) => {
    attendanceMap[a.registration_id.toString()] = a;
  });

  const rows = registrations.map((reg) => {
    const att = attendanceMap[reg._id.toString()];
    return {
      registration_id: reg._id,
      student: reg.student_id,
      registration_status: reg.registration_status,
      registered_at: reg.registered_at,
      attendance_status: att ? att.status : reg.registration_status === "cancelled" ? "cancelled" : "absent",
      checked_in_at: att?.checked_in_at ?? null,
    };
  });

  return { rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

// ── GENERATE REPORT DATA ──────────────────────────────────────────────────────

export async function generateReportData({ eventId, organizerId }) {
  const event = await resolveEvent(eventId);
  const ownerId =
    typeof event.submitted_by === "object"
      ? event.submitted_by.toString()
      : event.submitted_by;
  if (ownerId !== organizerId.toString()) {
    throw makeError("Access denied.", 403);
  }

  const registrations = await EventRegistration.find({ event_id: eventId })
    .populate("student_id", "fullName institutionId email")
    .sort({ registered_at: 1 })
    .lean();

  const regIds = registrations.map((r) => r._id);
  const attendances = await EventAttendance.find({ registration_id: { $in: regIds } }).lean();
  const attendanceMap = {};
  attendances.forEach((a) => { attendanceMap[a.registration_id.toString()] = a; });

  const rows = registrations.map((reg) => {
    const att = attendanceMap[reg._id.toString()];
    let attendanceStatus;
    if (reg.registration_status === "cancelled") {
      attendanceStatus = "Cancelled";
    } else if (att) {
      attendanceStatus = "Present";
    } else {
      attendanceStatus = "Absent";
    }
    return {
      registration_id: reg._id.toString(),
      student_name: reg.student_id?.fullName ?? "Unknown",
      roll_number: reg.student_id?.institutionId ?? "Unknown",
      email: reg.student_id?.email ?? "",
      registration_status: reg.registration_status === "confirmed" ? "Confirmed" : "Cancelled",
      registered_at: reg.registered_at,
      attendance_status: attendanceStatus,
      checked_in_at: att?.checked_in_at ?? null,
    };
  });

  const confirmed = rows.filter((r) => r.registration_status === "Confirmed").length;
  const present = rows.filter((r) => r.attendance_status === "Present").length;
  const absent = rows.filter((r) => r.attendance_status === "Absent").length;
  const cancelled = rows.filter((r) => r.attendance_status === "Cancelled").length;
  const percentage = confirmed > 0 ? Math.round((present / confirmed) * 100) : 0;

  return {
    event: {
      title: event.title,
      event_id: event.event_id,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      venue: event.venue,
    },
    summary: { confirmed, present, absent, cancelled, percentage },
    generated_at: new Date(),
    rows,
  };
}
