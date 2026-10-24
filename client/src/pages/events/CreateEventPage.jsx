import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createEventRequest, generateAnnouncementPoster, uploadPoster, uploadQR, uploadBrochure, getDepartments } from "../../services/eventService";
import {
  validateEventForm,
  validatePhone,
  validateEmail,
  validateOrgEmail,
  validateStartDate,
  validateEndDate,
  validateRegistrationDeadline,
} from "../../utils/eventValidation";
import FormSection from "../../components/FormSection";
import FileUploadField from "../../components/FileUploadField";
import Button from "../../components/Button";
import AudienceSelector from "../../components/AudienceSelector";
import InstagramPostPanel from "../../components/InstagramPostPanel";
import EventImageSelector from "../../components/EventImageSelector";
import { mediaUrl } from "../../utils/mediaUrl";
import { audienceLabel } from "../../utils/charusatData";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];
const STORAGE_KEY = "cc_event_draft";

const INITIAL = {
  requester_name: "", requester_role: "", custom_role: "", organization_type: "", organization_name: "",
  organization_email: "", contact_number: "", email: "",
  title: "", category: "", department_id: "", club_name: "",
  description: "", poster_url: "",
  start_date: "", end_date: "", start_time: "", end_time: "",
  venue: "", building: "", room: "", google_map_url: "",
  registration_required: false, registration_link: "", registration_deadline: "", qr_code_url: "",
  website_url: "", instagram_url: "", linkedin_url: "", facebook_url: "", whatsapp_url: "", brochure_url: "",
  audience: [],
  promoteOnInstagram: false,
};

const SECTIONS = ["Requester Info", "Basic Info", "Description", "Schedule", "Venue", "Registration", "Links", "Audience", "Announcement Image"];

const STEP_FIELDS = [
  ["requester_name", "requester_role", "custom_role", "organization_type", "organization_name", "organization_email", "contact_number", "email"],
  ["title", "category", "department_id"],
  ["description"],
  ["start_date", "end_date", "start_time", "end_time"],
  ["venue", "google_map_url"],
  ["registration_link", "registration_deadline"],
  ["website_url", "instagram_url", "linkedin_url", "facebook_url", "whatsapp_url"],
  [],
  [],
];

const formatPreviewDate = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => {
    try { return { ...INITIAL, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return INITIAL; }
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [departmentsError, setDepartmentsError] = useState("");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [showPreview, setShowPreview] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successId, setSuccessId] = useState(null);
  const [successMongoId, setSuccessMongoId] = useState(null);
  const [duplicateWarn, setDuplicateWarn] = useState(false);

  // Always override requester name/email from authenticated user (never use stale draft)
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        requester_name: user.fullName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const loadDepartments = useCallback(async () => {
    setDepartmentsError("");
    try {
      const response = await getDepartments();
      if (!Array.isArray(response.data.data)) {
        throw new Error("The department service returned an invalid response.");
      }
      setDepartments(response.data.data);
    } catch (error) {
      setDepartmentsError(error.response?.data?.message || error.message || "Department options could not be loaded.");
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    setServerError("");
  }, []);

  // Inline validators called on blur / change
  const inlineValidate = useCallback((field, value, formSnapshot) => {
    let err = "";
    if (field === "contact_number") err = validatePhone(value);
    else if (field === "email") err = validateEmail(value);
    else if (field === "organization_email") err = validateOrgEmail(value);
    else if (field === "start_date") {
      err = validateStartDate(value);
      // Re-validate end_date and deadline when start changes
      const endErr = validateEndDate(formSnapshot.end_date, value);
      const dlErr = formSnapshot.registration_required
        ? validateRegistrationDeadline(formSnapshot.registration_deadline, value)
        : "";
      setErrors((prev) => ({
        ...prev,
        ...(formSnapshot.end_date ? { end_date: endErr } : {}),
        ...(formSnapshot.registration_deadline ? { registration_deadline: dlErr } : {}),
      }));
    } else if (field === "end_date") {
      err = validateEndDate(value, formSnapshot.start_date);
    } else if (field === "registration_deadline") {
      err = validateRegistrationDeadline(value, formSnapshot.start_date);
    }
    if (err) setErrors((prev) => ({ ...prev, [field]: err }));
    else setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const handleChange = useCallback((field, value) => {
    setServerError("");
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      inlineValidate(field, value, next);
      return next;
    });
  }, [inlineValidate]);

  const handleBlur = useCallback((field) => {
    setForm((prev) => {
      inlineValidate(field, prev[field], prev);
      return prev;
    });
  }, [inlineValidate]);

  // ── Field renderers ──────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition";
  const labelCls = "text-xs font-medium text-gray-600 uppercase tracking-wide";

  const field = (name, label, type = "text", extra = {}) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => handleChange(name, e.target.value)}
        onBlur={() => handleBlur(name)}
        className={inputCls}
        {...extra}
      />
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const readonlyField = (name, label) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      {authLoading ? (
        <div className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-400 animate-pulse">Loading...</div>
      ) : (
        <input
          type="text"
          value={form[name]}
          readOnly
          className="w-full px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
        />
      )}
    </div>
  );

  const select = (name, label, options) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      <select
        value={form[name]}
        onChange={(e) => handleChange(name, e.target.value)}
        className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  const handlePreview = () => {
    const errs = validateEventForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const firstErrStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => errs[f]));
      if (firstErrStep !== -1) setStep(firstErrStep);
      setServerError("Please fix the errors below before previewing your event.");
      return;
    }
    setServerError("");
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const errs = validateEventForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShowPreview(false);
      const firstErrStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => errs[f]));
      if (firstErrStep !== -1) setStep(firstErrStep);
      setServerError("Please fix the errors below before submitting.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await createEventRequest(form);
      setDuplicateWarn(res.data.duplicate_warning);
      setSuccessId(res.data.data.event_id);
      setSuccessMongoId(res.data.data._id);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      setServerError(e.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────

  if (successId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Request Submitted!</h2>
            {duplicateWarn && <p className="text-xs text-amber-600 mb-2">A similar event may already exist. Your request is still pending review.</p>}
            <p className="text-xs text-gray-500 mb-1">Your event request is now <span className="font-semibold text-blue-600">Pending Approval</span>.</p>
            <p className="text-xs text-gray-400 mb-6 font-mono break-all">ID: {successId}</p>
            <div className="flex gap-2">
              <button onClick={() => navigate("/events/my")} className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">My Requests</button>
              <button onClick={() => { setSuccessId(null); setSuccessMongoId(null); setForm(INITIAL); setStep(0); setShowPreview(false); setErrors({}); }} className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">New Request</button>
            </div>
          </div>

          {/* Instagram Promotion Panel — shown when user opted in */}
          {form.promoteOnInstagram && successMongoId && (
            <InstagramPostPanel
              eventId={successMongoId}
              postType="EVENT_PROMOTION"
              eventPosterUrl={form.poster_url || null}
              title="Instagram Event Promotion"
            />
          )}
        </div>
      </div>
    );
  }

  if (showPreview) {
    const departmentName = departments.find((department) => department._id === form.department_id)?.name;
    const eventDetails = [
      ["Category", form.category],
      ["Department", departmentName],
      ["Club", form.club_name],
      ["Dates", [formatPreviewDate(form.start_date), form.end_date !== form.start_date ? formatPreviewDate(form.end_date) : ""].filter(Boolean).join(" – ")],
      ["Time", [form.start_time, form.end_time].filter(Boolean).join(" – ")],
      ["Venue", [form.venue, form.building, form.room && `Room ${form.room}`].filter(Boolean).join(", ")],
      ["Google Maps", form.google_map_url],
      ["Registration", form.registration_required ? "Required" : "Not required"],
      ["Registration link", form.registration_required ? form.registration_link : ""],
      ["Registration deadline", form.registration_required ? formatPreviewDate(form.registration_deadline) : ""],
      ["Audience", form.audience.length ? form.audience.map(audienceLabel).join(", ") : "Entire CHARUSAT student community"],
      ["Organizer", [form.organization_name, form.organization_type, form.requester_role === "Other" ? form.custom_role : form.requester_role].filter(Boolean).join(" · ")],
      ["Contact", [form.requester_name, form.email, form.organization_email, form.contact_number].filter(Boolean).join(" · ")],
      ["Website", form.website_url],
      ["Instagram", form.instagram_url],
      ["LinkedIn", form.linkedin_url],
      ["Facebook", form.facebook_url],
      ["WhatsApp", form.whatsapp_url],
      ["Brochure", form.brochure_url],
      ["Promote on Instagram", form.promoteOnInstagram ? "Yes" : "No"],
    ].filter(([, value]) => value);

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="mb-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to event form
          </button>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Review before submission</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Event Preview</h1>
            <p className="mt-1 text-sm text-gray-500">Check the event details below. Nothing is submitted until you confirm.</p>
          </div>

          <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {form.poster_url && (
              <img
                src={mediaUrl(form.poster_url)}
                alt={`${form.title} announcement`}
                className="max-h-72 w-full bg-gray-50 object-contain"
              />
            )}
            <div className="p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {form.category && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{form.category}</span>}
                {departmentName && <span className="text-xs text-gray-500">{departmentName}</span>}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{form.title}</h2>
              {form.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{form.description}</p>}

              <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                {eventDetails.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
                    <dd className="mt-0.5 break-words text-sm text-gray-700">
                      {label === "Brochure" && value ? (
                        <a href={mediaUrl(value)} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline">
                          View brochure
                        </a>
                      ) : value}
                    </dd>
                  </div>
                ))}
              </dl>
              {form.registration_required && form.qr_code_url && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Registration QR code</p>
                  <img src={mediaUrl(form.qr_code_url)} alt="Event registration QR code" className="mt-2 h-28 w-28 rounded border border-gray-200 object-contain" />
                </div>
              )}
            </div>
          </article>

          {serverError && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { setShowPreview(false); setServerError(""); }}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              Edit Event
            </button>
            <Button type="button" loading={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  const sections = [
    // 0 — Requester Info
    <FormSection title="Requester Information" key="requester">
      {readonlyField("requester_name", "Requester Name")}
      {readonlyField("email", "Requester Email")}
      {select("requester_role", "Your Role *", REQUESTER_ROLES)}
      {form.requester_role === "Other" && (
        <div className="sm:col-span-2">{field("custom_role", "Please specify your role *", "text", { placeholder: "e.g. Sports Secretary" })}</div>
      )}
      {select("organization_type", "Organization Type *", ORG_TYPES)}
      <div className="sm:col-span-2">{field("organization_name", "Organization Name", "text", { placeholder: "e.g. CSI Student Chapter, CE Department" })}</div>
      <div className="sm:col-span-2">
        {field("organization_email", "Organization Email *", "email", { placeholder: "e.g. csi@charusat.ac.in" })}
      </div>
      {field("contact_number", "Contact Number *", "tel", { placeholder: "10-digit mobile number" })}
    </FormSection>,

    // 1 — Basic Info
    <FormSection title="Basic Information" key="basic">
      <div className="sm:col-span-2">{field("title", "Event Title *", "text", { placeholder: "e.g. Annual Tech Fest 2025" })}</div>
      {select("category", "Category *", CATEGORIES)}
      {select("department_id", "Department *", departments.map((d) => ({ value: d._id, label: d.name })))}
      <div className="sm:col-span-2">{field("club_name", "Club Name (optional)", "text", { placeholder: "e.g. Coding Club" })}</div>
    </FormSection>,

    // 2 — Description
    <FormSection title="Event Description" key="desc">
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className={labelCls}>Short Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          placeholder="Describe the event. At least 50 words without an image, or 20 words with one."
          className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>
    </FormSection>,

    // 3 — Schedule
    <FormSection title="Schedule" key="sched">
      {field("start_date", "Start Date *", "date")}
      {field("end_date", "End Date *", "date")}
      {field("start_time", "Start Time *", "time")}
      {field("end_time", "End Time *", "time")}
    </FormSection>,

    // 4 — Venue
    <FormSection title="Venue" key="venue">
      <div className="sm:col-span-2">{field("venue", "Venue Name *", "text", { placeholder: "e.g. Main Auditorium" })}</div>
      {field("building", "Building (optional)", "text", { placeholder: "e.g. Block A" })}
      {field("room", "Room Number (optional)", "text", { placeholder: "e.g. 301" })}
      <div className="sm:col-span-2">{field("google_map_url", "Google Maps URL (optional)", "url", { placeholder: "https://maps.google.com/..." })}</div>
    </FormSection>,

    // 5 — Registration
    <FormSection title="Registration" key="reg">
      <div className="sm:col-span-2 flex items-center gap-3">
        <input
          type="checkbox"
          id="reg_required"
          checked={form.registration_required}
          onChange={(e) => set("registration_required", e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="reg_required" className="text-sm text-gray-700">Registration Required?</label>
      </div>
      {form.registration_required && (
        <>
          <div className="sm:col-span-2">{field("registration_link", "Registration Link", "url", { placeholder: "https://forms.google.com/..." })}</div>
          {field("registration_deadline", "Registration Deadline (optional)", "date")}
          <div className="sm:col-span-2">
            <FileUploadField
              label="QR Code (optional)"
              accept=".png,.jpg,.jpeg"
              maxMB={5}
              uploadFn={uploadQR}
              preview={form.qr_code_url}
              onUpload={(url) => set("qr_code_url", url)}
              note="PNG, JPG · max 5MB"
            />
          </div>
        </>
      )}
    </FormSection>,

    // 6 — Links
    <FormSection title="External Links (optional)" key="links">
      {field("website_url", "Website", "url", { placeholder: "https://..." })}
      {field("instagram_url", "Instagram", "url", { placeholder: "https://instagram.com/..." })}
      {field("linkedin_url", "LinkedIn", "url", { placeholder: "https://linkedin.com/..." })}
      {field("facebook_url", "Facebook", "url", { placeholder: "https://facebook.com/..." })}
      {field("whatsapp_url", "WhatsApp", "url", { placeholder: "https://wa.me/..." })}
      <div className="sm:col-span-2">
        <FileUploadField
          label="Brochure PDF (optional)"
          accept=".pdf"
          maxMB={10}
          uploadFn={uploadBrochure}
          preview={form.brochure_url}
          onUpload={(url) => set("brochure_url", url)}
          note="PDF · max 10MB"
        />
      </div>
    </FormSection>,

    // 7 — Audience
    <FormSection title="Target Audience" key="audience">
      <div className="sm:col-span-2">
        <AudienceSelector
          value={form.audience.length > 0 ? form.audience : [{ audience_type: "COLLEGE", college_id: "", program_id: "", year: "", custom_audience: "" }]}
          onChange={(audience) => set("audience", audience)}
          error={errors.audience}
        />
      </div>
      <div className="sm:col-span-2 mt-4 flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl">
        <input
          type="checkbox"
          id="promote_instagram"
          checked={form.promoteOnInstagram}
          onChange={(e) => set("promoteOnInstagram", e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-purple-600"
        />
        <label htmlFor="promote_instagram" className="text-sm text-gray-700 cursor-pointer">
          <span className="font-semibold text-purple-700">Promote this event on Instagram</span>
          <p className="text-xs text-gray-500 mt-0.5">After submission, generate an AI-powered Instagram promotional post for this event.</p>
        </label>
      </div>
    </FormSection>,
    <FormSection title="Announcement Image" key="announcement-image">
      <div className="sm:col-span-2">
        <EventImageSelector
          label="Event announcement image"
          value={form.poster_url}
          onChange={(url) => set("poster_url", url)}
          uploadFn={uploadPoster}
          generateFn={() => {
            const department = departments.find((item) => item._id === form.department_id);
            return generateAnnouncementPoster({
              title: form.title,
              category: form.category,
              description: form.description,
              start_date: form.start_date,
              start_time: form.start_time,
              venue: form.venue,
              department: department?.name || "",
              requester_name: form.requester_name,
              organization_name: form.organization_name,
            });
          }}
        />
      </div>
    </FormSection>,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-5">
        {/* Header */}
        <div className="mb-3">
          <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900">Create Event Request</h1>
          <p className="text-xs text-gray-400 mt-1">
            Your draft is saved automatically. ·{" "}
            <button
              onClick={() => { localStorage.removeItem(STORAGE_KEY); setForm(INITIAL); setStep(0); setShowPreview(false); setErrors({}); setServerError(""); }}
              className="text-red-400 hover:text-red-500 underline"
            >
              Clear draft
            </button>
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-3">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-gray-200"}`}
              title={s}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-2.5 font-medium">{step + 1} / {SECTIONS.length} — {SECTIONS[step]}</p>

        {departmentsError && (
          <div role="alert" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">{departmentsError}</p>
            <button type="button" onClick={loadDepartments} className="text-xs font-semibold text-amber-800 underline underline-offset-2">
              Retry
            </button>
          </div>
        )}

        {/* Section */}
        <div className="flex-1">
          {sections[step]}
        </div>

        {serverError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 font-medium">{serverError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-[var(--cc-bg)] sm:mx-0 sm:mt-auto sm:border-0 sm:px-0 sm:py-0">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="min-h-10 min-w-28 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            >
              Back
            </button>
          )}
          {step < SECTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="ml-auto min-h-10 min-w-28 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePreview}
              className="ml-auto min-h-10 min-w-28 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Preview Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
