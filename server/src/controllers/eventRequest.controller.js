import EventRequest from "../models/EventRequest.js";
import sanitizeHtml from "sanitize-html";

const sanitize = (str) => (str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }) : str);

const sanitizeBody = (body) => {
  const textFields = ["requester_name", "title", "club_name", "description", "venue", "building", "room"];
  const result = { ...body };
  textFields.forEach((f) => { if (result[f]) result[f] = sanitize(result[f]); });
  return result;
};

const buildEventData = (body, userId) => {
  const b = sanitizeBody(body);
  return {
    requester_name: b.requester_name,
    requester_role: b.requester_role,
    custom_role: b.custom_role || null,
    organization_type: b.organization_type,
    organization_name: b.organization_name || null,
    contact_number: b.contact_number,
    email: b.email,
    title: b.title,
    category: b.category,
    department_id: b.department_id,
    club_name: b.club_name || null,
    description: b.description || null,
    start_date: b.start_date,
    end_date: b.end_date,
    start_time: b.start_time,
    end_time: b.end_time,
    venue: b.venue,
    building: b.building || null,
    room: b.room || null,
    google_map_url: b.google_map_url || null,
    registration_required: b.registration_required === "true" || b.registration_required === true,
    registration_link: b.registration_link || null,
    registration_deadline: b.registration_deadline || null,
    qr_code_url: b.qr_code_url || null,
    website_url: b.website_url || null,
    instagram_url: b.instagram_url || null,
    linkedin_url: b.linkedin_url || null,
    facebook_url: b.facebook_url || null,
    whatsapp_url: b.whatsapp_url || null,
    brochure_url: b.brochure_url || null,
    audience: b.audience ? (typeof b.audience === "string" ? JSON.parse(b.audience) : b.audience) : [],
    updated_by: userId,
  };
};

// POST /api/event-requests
export const createEventRequest = async (req, res, next) => {
  try {
    const data = buildEventData(req.body, req.user.id);

    // Description/poster validation
    if (!data.description && !data.poster_url) {
      return res.status(400).json({ success: false, message: "Either a description or a poster is required." });
    }
    if (data.description) {
      const wordCount = data.description.trim().split(/\s+/).length;
      const minWords = data.poster_url ? 20 : 50;
      if (wordCount < minWords) {
        return res.status(400).json({ success: false, message: `Description must be at least ${minWords} words.` });
      }
    }

    // Duplicate detection (warn, not reject — return flag)
    const duplicate = await EventRequest.findOne({
      title: data.title,
      department_id: data.department_id,
      start_date: new Date(data.start_date),
      is_deleted: false,
    });

    const eventRequest = await EventRequest.create({
      ...data,
      status: "Pending Approval",
      submitted_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Event request submitted successfully.",
      duplicate_warning: !!duplicate,
      data: { event_id: eventRequest.event_id, _id: eventRequest._id, status: eventRequest.status },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/event-requests/my
export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await EventRequest.find({ submitted_by: req.user.id, is_deleted: false })
      .populate("department_id", "name code")
      .select("event_id title category department_id status created_at updated_at")
      .sort({ created_at: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// GET /api/event-requests/:id
export const getEventRequest = async (req, res, next) => {
  try {
    const request = await EventRequest.findOne({
      _id: req.params.id,
      submitted_by: req.user.id,
      is_deleted: false,
    }).populate("department_id", "name code");

    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });

    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// PUT /api/event-requests/:id
export const updateEventRequest = async (req, res, next) => {
  try {
    const request = await EventRequest.findOne({
      _id: req.params.id,
      submitted_by: req.user.id,
      is_deleted: false,
    });

    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });
    if (request.status !== "Pending Approval") {
      return res.status(403).json({ success: false, message: "Only pending requests can be edited." });
    }

    const data = buildEventData(req.body, req.user.id);

    if (!data.description && !request.poster_url && !data.poster_url) {
      return res.status(400).json({ success: false, message: "Either a description or a poster is required." });
    }
    if (data.description) {
      const hasPoster = data.poster_url || request.poster_url;
      const wordCount = data.description.trim().split(/\s+/).length;
      const minWords = hasPoster ? 20 : 50;
      if (wordCount < minWords) {
        return res.status(400).json({ success: false, message: `Description must be at least ${minWords} words.` });
      }
    }

    Object.assign(request, data);
    await request.save();

    res.json({ success: true, message: "Event request updated.", data: { event_id: request.event_id, status: request.status } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/event-requests/:id  (soft delete)
export const deleteEventRequest = async (req, res, next) => {
  try {
    const request = await EventRequest.findOne({
      _id: req.params.id,
      submitted_by: req.user.id,
      is_deleted: false,
    });

    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });
    if (request.status !== "Pending Approval") {
      return res.status(403).json({ success: false, message: "Only pending requests can be deleted." });
    }

    request.is_deleted = true;
    request.deleted_at = new Date();
    await request.save();

    res.json({ success: true, message: "Event request deleted." });
  } catch (err) {
    next(err);
  }
};
