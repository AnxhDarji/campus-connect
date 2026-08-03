import EventRequest from "../models/EventRequest.js";
import User from "../models/User.js";
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
    // Auto delete completed events
    await EventRequest.updateMany(
      { 
        is_deleted: false,
        end_date: { $lt: new Date() } 
      },
      { 
        is_deleted: true,
        deleted_at: new Date()
      }
    );

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
      is_deleted: false,
      $or: [
        { submitted_by: req.user.id },
        { status: { $in: ["Approved", "Published", "Archived"] } }
      ]
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
    if (request.status !== "Pending Approval" && request.status !== "Rejected" && request.status !== "Returned for Changes") {
      return res.status(403).json({ success: false, message: "This request cannot be edited in its current status." });
    }

    const data = buildEventData(req.body, req.user.id);
    data.status = "Pending Approval"; // Reset status to Pending Approval when edited/resubmitted

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
    if (request.status !== "Pending Approval" && request.status !== "Rejected" && request.status !== "Returned for Changes") {
      return res.status(403).json({ success: false, message: "This request cannot be deleted." });
    }

    request.is_deleted = true;
    request.deleted_at = new Date();
    await request.save();

    res.json({ success: true, message: "Event request deleted." });
  } catch (err) {
    next(err);
  }
};

// GET /api/event-requests (Public list of approved/published events)
export const listPublishedEvents = async (req, res, next) => {
  try {
    // Auto delete completed events
    await EventRequest.updateMany(
      { 
        is_deleted: false,
        end_date: { $lt: new Date() } 
      },
      { 
        is_deleted: true,
        deleted_at: new Date()
      }
    );

    const { category, department_id, search, archive, feedType, page = 1, limit = 20 } = req.query;

    const query = { is_deleted: false };

    if (category) query.category = category;
    if (department_id) query.department_id = department_id;
    if (search) query.title = { $regex: search, $options: "i" };

    if (archive === "true") {
      query.status = "Archived";
    } else {
      query.status = { $in: ["Approved", "Published"] };
      query.end_date = { $gte: new Date() };
    }

    if (feedType === "featured") {
      query["admin_metadata.is_featured"] = true;
    }

    let sort = { created_at: -1 };
    if (feedType === "trending") {
      sort = { "admin_metadata.priority": -1, created_at: -1 };
    } else if (feedType === "upcoming") {
      sort = { start_date: 1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EventRequest.find(query)
        .populate("department_id", "name code")
        .select("-__v")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      EventRequest.countDocuments(query),
    ]);

    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/event-requests/:id/bookmark
export const toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const eventId = req.params.id;
    const event = await EventRequest.findOne({ _id: eventId, is_deleted: false });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (!user.bookmarks) {
      user.bookmarks = [];
    }
    const index = user.bookmarks.indexOf(eventId);
    let bookmarked = false;
    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(eventId);
      bookmarked = true;
    }

    await user.save();
    res.json({ success: true, bookmarked, message: bookmarked ? "Event bookmarked." : "Bookmark removed." });
  } catch (err) {
    next(err);
  }
};

// GET /api/event-requests/my-bookmarks
export const myBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "bookmarks",
      match: { is_deleted: false },
      populate: { path: "department_id", select: "name code" }
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, data: user.bookmarks || [] });
  } catch (err) {
    next(err);
  }
};

// GET /api/event-requests/festivals/:name
export const getFestivalEvents = async (req, res, next) => {
  try {
    const { name } = req.params;
    const events = await EventRequest.find({
      "admin_metadata.festival_name": { $regex: new RegExp(`^${name}$`, "i") },
      status: { $in: ["Approved", "Published", "Archived"] },
      is_deleted: false
    })
      .populate("department_id", "name code")
      .sort({ "admin_metadata.festival_day": 1, start_time: 1 });

    // Group events by day
    const grouped = {};
    events.forEach(event => {
      const day = event.admin_metadata.festival_day || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    });

    res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
};
