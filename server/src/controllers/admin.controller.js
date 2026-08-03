import EventRequest from "../models/EventRequest.js";
import User from "../models/User.js";

const ADMIN_ROLES = ["Super Admin", "Dept Admin", "Admin"];

// Build department filter based on role
const deptFilter = (user) => {
  if (user.role === "Super Admin" || user.role === "Admin") return {};
  if (user.role === "Dept Admin" && user.department_id) {
    return { department_id: user.department_id };
  }
  return null; // no access
};

// GET /api/admin/event-requests
export const listRequests = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const { status, department, category, organization_type, requester_role, search, page = 1, limit = 20, sortBy = "created_at", sortOrder = "desc" } = req.query;

    const query = { is_deleted: false, ...filter };
    if (status) query.status = status;
    if (department) query.department_id = department;
    if (category) query.category = category;
    if (organization_type) query.organization_type = organization_type;
    if (requester_role) query.requester_role = requester_role;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { requester_name: { $regex: search, $options: "i" } },
        { organization_name: { $regex: search, $options: "i" } },
      ];
    }

    const sortField = ["created_at", "start_date", "title", "category"].includes(sortBy) ? sortBy : "created_at";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EventRequest.find(query)
        .populate("department_id", "name code")
        .populate("submitted_by", "fullName email")
        .populate("approved_by", "fullName")
        .populate("rejected_by", "fullName")
        .select("-__v")
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(Number(limit)),
      EventRequest.countDocuments(query),
    ]);

    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/event-requests/stats
export const getStats = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const base = { is_deleted: false, ...filter };
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [pending, approved, rejected, total, approvedToday] = await Promise.all([
      EventRequest.countDocuments({ ...base, status: "Pending Approval" }),
      EventRequest.countDocuments({ ...base, status: "Approved" }),
      EventRequest.countDocuments({ ...base, status: "Rejected" }),
      EventRequest.countDocuments(base),
      EventRequest.countDocuments({ ...base, status: "Approved", approved_at: { $gte: todayStart } }),
    ]);

    res.json({ success: true, data: { pending, approved, rejected, total, approvedToday } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/event-requests/:id
export const getRequest = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const request = await EventRequest.findOne({ _id: req.params.id, is_deleted: false, ...filter })
      .populate("department_id", "name code")
      .populate("submitted_by", "fullName email institutionId")
      .populate("approved_by", "fullName email")
      .populate("rejected_by", "fullName email");

    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });

    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/event-requests/:id/approve
export const approveRequest = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const request = await EventRequest.findOne({ _id: req.params.id, is_deleted: false, ...filter });
    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });
    if (request.status !== "Pending Approval") {
      return res.status(400).json({ success: false, message: "Only pending requests can be approved." });
    }

    request.status = "Approved";
    request.approved_by = req.user.id;
    request.approved_at = new Date();
    request.updated_by = req.user.id;
    if (req.body && req.body.admin_metadata) {
      request.admin_metadata = {
        ...(request.admin_metadata || {}),
        ...req.body.admin_metadata,
      };
    }
    await request.save();

    res.json({ success: true, message: "Event request approved.", data: { status: request.status } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/event-requests/:id/reject
export const rejectRequest = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const { rejection_reason } = req.body;
    if (!rejection_reason?.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const request = await EventRequest.findOne({ _id: req.params.id, is_deleted: false, ...filter });
    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });
    if (request.status !== "Pending Approval") {
      return res.status(400).json({ success: false, message: "Only pending requests can be rejected." });
    }

    request.status = "Rejected";
    request.rejected_by = req.user.id;
    request.rejected_at = new Date();
    request.rejection_reason = rejection_reason.trim();
    request.updated_by = req.user.id;
    await request.save();

    res.json({ success: true, message: "Event request rejected.", data: { status: request.status } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/event-requests/:id
export const editRequest = async (req, res, next) => {
  try {
    const filter = deptFilter(req.user);
    if (filter === null) return res.status(403).json({ success: false, message: "Access denied." });

    const EDITABLE = ["title", "venue", "building", "room", "description", "start_time", "end_time"];
    const request = await EventRequest.findOne({ _id: req.params.id, is_deleted: false, ...filter });
    if (!request) return res.status(404).json({ success: false, message: "Event request not found." });

    EDITABLE.forEach((f) => { if (req.body[f] !== undefined) request[f] = req.body[f]; });
    if (req.body.admin_metadata) {
      request.admin_metadata = {
        ...request.admin_metadata,
        ...req.body.admin_metadata,
      };
    }
    request.updated_by = req.user.id;
    await request.save();

    res.json({ success: true, message: "Event request updated.", data: { _id: request._id } });
  } catch (err) {
    next(err);
  }
};
