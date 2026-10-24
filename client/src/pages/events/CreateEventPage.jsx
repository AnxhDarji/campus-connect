import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createEventRequest, uploadPoster, uploadQR, uploadBrochure, getDepartments } from "../../services/eventService";
import { validateStep, validateEventForm, validatePhone, validateOrgEmail, validateStartDate, validateEndDate, validateRegistrationDeadline } from "../../utils/eventValidation";
import FileUploadField from "../../components/FileUploadField";
import Button from "../../components/Button";
import AudienceSelector from "../../components/AudienceSelector";
import InstagramPostPanel from "../../components/InstagramPostPanel";

const CATEGORIES = ["Technical","Non-Technical","Workshop","Seminar","Sports","Cultural","Competition","Placement","Festival","Other"];
const REQUESTER_ROLES = ["Event Manager","Club Representative","Volunteer Lead","Media Team Member","Faculty Coordinator","Student Coordinator","Department Representative","External College Representative","Student","Other"];
const ORG_TYPES = ["Department","Student Club","College Committee","Faculty","External College","Student Group","Other"];
const STORAGE_KEY = "cc_event_draft";
const STEPS = ["Who are you?", "Event Details", "When & Where", "Registration & Links"];

const INITIAL = {
  requester_name: "", requester_role: "", custom_role: "",
  organization_type: "", organization_name: "", organization_email: "", contact_number: "", email: "",
  title: "", category: "", department_id: "", club_name: "", description: "", poster_url: "",
  start_date: "", end_date: "", start_time: "", end_time: "",
  venue: "", building: "", room: "", google_map_url: "",
  registration_required: false, registration_link: "", registration_deadline: "", qr_code_url: "",
  website_url: "", instagram_url: "", linkedin_url: "", facebook_url: "", whatsapp_url: "", brochure_url: "",
  audience: [],
  promoteOnInstagram: false,
};

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => {
    try { return { ...INITIAL, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
    catch { return INITIAL; }
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [serverError, setServerError] = useState("");
  const [successId, setSuccessId] = useState(null);
  const [successMongoId, setSuccessMongoId] = useState(null);
  const [duplicateWarn, setDuplicateWarn] = useState(false);

  useEffect(() => {
    if (user) setForm((p) => ({ ...p, requester_name: user.fullName || "", email: user.email || "" }));
  }, [user]);

  useEffect(() => {
    getDepartments().then((r) => setDepartments(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const set = useCallback((field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const e = { ...p }; delete e[field]; return e; });
    setServerError("");
  }, []);

  const handleChange = useCallback((field, value) => {
    setServerError("");
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      let err = "";
      if (field === "contact_number") err = validatePhone(value);
      else if (field === "organization_email") err = validateOrgEmail(value);
      else if (field === "start_date") err = validateStartDate(value);
      else if (field === "end_date") err = validateEndDate(value, next.start_date);
      else if (field === "registration_deadline") err = validateRegistrationDeadline(value, next.start_date);
      if (err) setErrors((e) => ({ ...e, [field]: err }));
      else setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
      return next;
    });
  }, []);

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const errs = validateEventForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setServerError("Please fix the errors before submitting.");
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

  const cls = "w-full px-3 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition";
  const lbl = "text-xs font-medium text-gray-600 uppercase tracking-wide";

  const F = (name, label, type = "text", extra = {}) => (
    <div className="flex flex-col gap-1">
      <label className={lbl}>{label}</label>
      <input type={type} value={form[name]} onChange={(e) => handleChange(name, e.target.value)} className={cls} {...extra} />
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const Readonly = (name, label) => (
    <div className="flex flex-col gap-1">
      <label className={lbl}>{label}</label>
      {authLoading
        ? <div className="w-full px-3 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-400 animate-pulse">Loading...</div>
        : <input type="text" value={form[name]} readOnly className="w-full px-3 py-2.5 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed" />}
    </div>
  );

  const Sel = (name, label, options) => (
    <div className="flex flex-col gap-1">
      <label className={lbl}>{label}</label>
      <select value={form[name]} onChange={(e) => handleChange(name, e.target.value)} className={cls}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  if (successId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Request Submitted!</h2>
            {duplicateWarn && <p className="text-xs text-amber-600 mb-2">⚠ A similar event may already exist. Your request is still pending review.</p>}
            <p className="text-xs text-gray-500 mb-1">Status: <span className="font-semibold text-blue-600">Pending Approval</span></p>
            <p className="text-xs text-gray-400 mb-6 font-mono break-all">ID: {successId}</p>
            <div className="flex gap-2">
              <button onClick={() => navigate("/events/my")} className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">My Requests</button>
              <button onClick={() => { setSuccessId(null); setSuccessMongoId(null); setForm(INITIAL); setStep(0); setErrors({}); }} className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">New Request</button>
            </div>
          </div>
          {form.promoteOnInstagram && successMongoId && (
            <InstagramPostPanel eventId={successMongoId} postType="EVENT_PROMOTION" eventPosterUrl={form.poster_url || null} title="Instagram Event Promotion" />
          )}
        </div>
      </div>
    );
  }

  const stepContent = [
    // Step 0 — Who are you?
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" key="s0">
      {Readonly("requester_name", "Your Name")}
      {Readonly("email", "Your Email")}
      {Sel("requester_role", "Your Role *", REQUESTER_ROLES)}
      {form.requester_role === "Other" && F("custom_role", "Specify Role *", "text", { placeholder: "e.g. Sports Secretary" })}
      {Sel("organization_type", "Organization Type *", ORG_TYPES)}
      {F("organization_name", "Organization Name", "text", { placeholder: "e.g. CSI Student Chapter" })}
      {F("organization_email", "Organization Email *", "email", { placeholder: "e.g. csi@charusat.ac.in" })}
      {F("contact_number", "Contact Number *", "tel", { placeholder: "10-digit mobile number" })}
    </div>,

    // Step 1 — Event Details
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" key="s1">
      <div className="sm:col-span-2">{F("title", "Event Title *", "text", { placeholder: "e.g. Annual Tech Fest 2025" })}</div>
      {Sel("category", "Category *", CATEGORIES)}
      {Sel("department_id", "Department *", departments.map((d) => ({ value: d._id, label: d.name })))}
      {F("club_name", "Club / Committee (optional)", "text", { placeholder: "e.g. Coding Club" })}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className={lbl}>Description {form.poster_url ? "(min 20 words)" : "(min 50 words) *"}</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
          placeholder="Describe the event — what it is, who should attend, what they will gain..."
          className="w-full px-3 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>
      <div className="sm:col-span-2">
        <FileUploadField
          label="Event Poster (optional)"
          accept=".jpg,.jpeg,.png,.webp"
          maxMB={10}
          uploadFn={uploadPoster}
          preview={form.poster_url}
          onUpload={(url) => set("poster_url", url)}
          note="JPG, PNG, WEBP · max 10MB · uploading a poster reduces description minimum to 20 words"
        />
      </div>
    </div>,

    // Step 2 — When & Where
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" key="s2">
      {F("start_date", "Start Date *", "date")}
      {F("end_date", "End Date *", "date")}
      {F("start_time", "Start Time *", "time")}
      {F("end_time", "End Time *", "time")}
      <div className="sm:col-span-2">{F("venue", "Venue *", "text", { placeholder: "e.g. Main Auditorium" })}</div>
      {F("building", "Building (optional)", "text", { placeholder: "e.g. Block A" })}
      {F("room", "Room (optional)", "text", { placeholder: "e.g. 301" })}
      <div className="sm:col-span-2">{F("google_map_url", "Google Maps Link (optional)", "url", { placeholder: "https://maps.google.com/..." })}</div>
    </div>,

    // Step 3 — Registration, Links & Audience
    <div className="space-y-4" key="s3">
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Registration</h3>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="reg_req" checked={form.registration_required}
            onChange={(e) => set("registration_required", e.target.checked)} className="w-4 h-4 accent-blue-600" />
          <label htmlFor="reg_req" className="text-sm text-gray-700">Registration required for this event</label>
        </div>
        {form.registration_required && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="sm:col-span-2">{F("registration_link", "Registration Link", "url", { placeholder: "https://forms.google.com/..." })}</div>
            {F("registration_deadline", "Registration Deadline (optional)", "date")}
            <div className="sm:col-span-2">
              <FileUploadField label="QR Code (optional)" accept=".png,.jpg,.jpeg" maxMB={5}
                uploadFn={uploadQR} preview={form.qr_code_url}
                onUpload={(url) => set("qr_code_url", url)} note="PNG, JPG · max 5MB" />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          External Links <span className="font-normal text-gray-400 normal-case">(all optional)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {F("website_url", "Website", "url", { placeholder: "https://..." })}
          {F("instagram_url", "Instagram Page", "url", { placeholder: "https://instagram.com/..." })}
          {F("linkedin_url", "LinkedIn", "url", { placeholder: "https://linkedin.com/..." })}
          {F("whatsapp_url", "WhatsApp Group", "url", { placeholder: "https://wa.me/..." })}
          <div className="sm:col-span-2">
            <FileUploadField label="Brochure PDF (optional)" accept=".pdf" maxMB={10}
              uploadFn={uploadBrochure} preview={form.brochure_url}
              onUpload={(url) => set("brochure_url", url)} note="PDF · max 10MB" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Target Audience</h3>
        <AudienceSelector
          value={form.audience.length > 0 ? form.audience : [{ audience_type: "COLLEGE", college_id: "", program_id: "", year: "", custom_audience: "" }]}
          onChange={(v) => set("audience", v)}
          error={errors.audience}
        />
      </div>

      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl">
        <input type="checkbox" id="promote_ig" checked={form.promoteOnInstagram}
          onChange={(e) => set("promoteOnInstagram", e.target.checked)} className="w-4 h-4 mt-0.5 accent-purple-600" />
        <label htmlFor="promote_ig" className="cursor-pointer">
          <span className="text-sm font-semibold text-purple-700">📸 Promote this event on Instagram</span>
          <p className="text-xs text-gray-500 mt-0.5">After submission, generate an AI-powered Instagram promotional post for this event.</p>
        </label>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-4">
          <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Create Event Request</h1>
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setForm(INITIAL); setStep(0); setErrors({}); setServerError(""); }}
              className="text-xs text-red-400 hover:text-red-500 underline">
              Clear draft
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Draft saved automatically · Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < step ? "bg-blue-500" : i === step ? "bg-blue-400" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="flex justify-between mb-5">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-[10px] font-medium truncate ${i === step ? "text-blue-600" : "text-gray-400"}`}>{s}</span>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{STEPS[step]}</h2>
          {stepContent[step]}
        </div>

        {serverError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 font-medium">{serverError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Next
            </button>
          ) : (
            <Button loading={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
