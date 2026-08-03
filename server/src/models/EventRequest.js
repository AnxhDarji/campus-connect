import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const audienceSchema = new mongoose.Schema(
  {
    audience_type: { type: String, required: true, enum: ["College", "Department", "Year"] },
    audience_value: { type: String, required: true },
  },
  { _id: false }
);

const adminMetadataSchema = new mongoose.Schema(
  {
    tier: { type: String, enum: ["Top Tier", "Medium Tier", "Low Tier"], default: "Low Tier" },
    is_featured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    badge: { type: String, default: null },
    festival_name: { type: String, default: null },
    festival_day: { type: Number, default: null },
  },
  { _id: false }
);

const eventRequestSchema = new mongoose.Schema(
  {
    event_id: { type: String, default: () => uuidv4(), unique: true, immutable: true },

    // Requester Information
    requester_name: { type: String, required: true, trim: true },
    requester_role: {
      type: String,
      required: true,
      enum: ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"],
    },
    custom_role: { type: String, trim: true, default: null },
    organization_type: {
      type: String,
      required: true,
      enum: ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"],
    },
    organization_name: { type: String, trim: true, default: null },
    contact_number: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    // Basic Info
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"],
    },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    club_name: { type: String, trim: true, default: null },

    // Description
    description: { type: String, trim: true, default: null },
    poster_url: { type: String, default: null },

    // Schedule
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },

    // Venue
    venue: { type: String, required: true, trim: true },
    building: { type: String, trim: true, default: null },
    room: { type: String, trim: true, default: null },
    google_map_url: { type: String, default: null },

    // Registration
    registration_required: { type: Boolean, default: false },
    registration_link: { type: String, default: null },
    registration_deadline: { type: Date, default: null },
    qr_code_url: { type: String, default: null },

    // External Links
    website_url: { type: String, default: null },
    instagram_url: { type: String, default: null },
    linkedin_url: { type: String, default: null },
    facebook_url: { type: String, default: null },
    whatsapp_url: { type: String, default: null },
    brochure_url: { type: String, default: null },

    // Audience
    audience: { type: [audienceSchema], default: [] },

    // Status & Lifecycle
    status: {
      type: String,
      enum: ["Pending Approval", "Approved", "Rejected", "Returned for Changes", "Published", "Archived"],
      default: "Pending Approval",
    },

    // Review Workflow
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
    rejected_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejected_at: { type: Date, default: null },
    rejection_reason: { type: String, trim: true, default: null },

    // Ownership & Audit
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Soft Delete
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },

    // Admin Metadata
    admin_metadata: { type: adminMetadataSchema, default: () => ({}) },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Index for duplicate detection
eventRequestSchema.index({ title: 1, department_id: 1, start_date: 1 });

const EventRequest = mongoose.model("EventRequest", eventRequestSchema);
export default EventRequest;
