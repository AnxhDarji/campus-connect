import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEventRequest, updateEventRequest,
  uploadPoster, uploadQR, uploadBrochure, getDepartments,
} from "../../services/eventService";
import {
  validateEventForm, validatePhone, validateEmail, validateOrgEmail,
  validateStartDate, validateEndDate, validateRegistrationDeadline,
} from "../../utils/eventValidation";
import FormSection from "../../components/FormSection";
import FileUploadField from "../../components/FileUploadField";
import Button from "../../components/Button";
import AudienceSelector from "../../components/AudienceSelector";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];
const SECTIONS = ["Requester Info", "Basic Info", "Description", "Schedule", "Venue", "Registration", "Links", "Audience"];

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    Promise.all([getEventRequest(id), getDepartments()])
      .then(([evRes, deptRes]) => {
        const d = evRes.data.data;
        if (d.status !== "Pending Approval" && d.status !== "Rejected" && d.status !== "Returned for Changes") {
          navigate("/events/my"); return;
        }
        setForm({
          requester_name: d.requester_name || "",
          requester_role: d.requester_role || "",
          custom_role: d.custom_role || "",
          organization_type: d.organization_type || "",
          organization_name: d.organization_name || "",
          organization_email: d.organization_email || "",
          contact_number: d.contact_number || "",
          email: d.email || "",
          title: d.title || "", category: d.category || "",
          department_id: d.department_id?._id || "",
          club_name: d.club_name || "", description: d.description || "",
          poster_url: d.poster_url || "",
          start_date: d.start_date ? d.start_date.slice(0, 10) : "",
          end_date: d.end_date ? d.end_date.slice(0, 10) : "",
          start_time: d.start_time || "", end_time: d.end_time || "",
          venue: d.venue || "", building: d.building || "", room: d.room || "",
          google_map_url: d.google_map_url || "",
          registration_required: d.registration_required || false,
          registration_link: d.registration_link || "",
          registration_deadline: d.registration_deadline ? d.registration_deadline.slice(0, 10) : "",
          qr_code_url: d.qr_code_url || "",
          website_url: d.website_url || "", instagram_url: d.instagram_url || "",
          linkedin_url: d.linkedin_url || "", facebook_url: d.facebook_url || "",
          whatsapp_url: d.whatsapp_url || "", brochure_url: d.brochure_url || "",
          audience: d.audience || [],
        });
        setDepartments(deptRes.data.data || []);
      })
      .catch(() => navigate("/events/my"));
  }, [id]);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const inlineValidate = useCallback((field, value, formSnapshot) => {
    let err = "";
    if (field === "contact_number") err = validatePhone(value);
    else if (field === "email") err = validateEmail(value);
    else if (field === "organization_email") err = validateOrgEmail(value);
    else if (field === "start_date") {
      err = validateStartDate(value);
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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      inlineValidate(field, value, next);
      return next;
    });
  }, [inlineValidate]);

  const handleBlur = useCallback((field) => {
    setForm((prev) => { inlineValidate(field, prev[field], prev); return prev; });
  }, [inlineValidate]);

  const inputCls = "w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition";
  const labelCls = "text-xs font-medium text-gray-600 uppercase tracking-wide";

  const field = (name, label, type = "text", extra = {}) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      <input
        type={type} value={form[name]}
        onChange={(e) => handleChange(name, e.target.value)}
        onBlur={() => handleBlur(name)}
        className={inputCls} {...extra}
      />
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const select = (name, label, options) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      <select value={form[name]} onChange={(e) => handleChange(name, e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const handleSubmit = async () => {
    const errs = validateEventForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const firstErrStep = [
        ["requester_name", "requester_role", "custom_role", "organization_type", "organization_name", "organization_email", "contact_number", "email"],
        ["title", "category", "department_id"],
        ["description"],
        ["start_date", "end_date", "start_time", "end_time"],
        ["venue", "google_map_url"],
        ["registration_link", "registration_deadline"],
        ["website_url", "instagram_url", "linkedin_url", "facebook_url", "whatsapp_url"],
        [],
      ].findIndex((fields) => fields.some((f) => errs[f]));
      if (firstErrStep !== -1) setStep(firstErrStep);
      setServerError("Please fix the errors below before saving.");
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      await updateEventRequest(id, form);
      navigate("/events/my");
    } catch (e) {
      setServerError(e.response?.data?.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading...</div>;

  const sections = [
    <FormSection title="Requester Information" key="requester">
      {field("requester_name", "Requester Name *")}
      {field("email", "Requester Email *", "email")}
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

    <FormSection title="Basic Information" key="basic">
      <div className="sm:col-span-2">{field("title", "Event Title *", "text", { placeholder: "e.g. Annual Tech Fest 2025" })}</div>
      {select("category", "Category *", CATEGORIES)}
      {select("department_id", "Department *", departments.map((d) => ({ value: d._id, label: d.name })))}
      <div className="sm:col-span-2">{field("club_name", "Club Name (optional)", "text", { placeholder: "e.g. Coding Club" })}</div>
    </FormSection>,

    <FormSection title="Event Description" key="desc">
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className={labelCls}>Short Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
          placeholder="Describe the event... (min 50 words without poster, 20 words with poster)"
          className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>
      <div className="sm:col-span-2">
        <FileUploadField label="Event Poster" accept=".jpg,.jpeg,.png,.webp" maxMB={10}
          uploadFn={uploadPoster} preview={form.poster_url} onUpload={(url) => set("poster_url", url)} note="JPG, JPEG, PNG, WEBP · max 10MB" />
      </div>
    </FormSection>,

    <FormSection title="Schedule" key="sched">
      {field("start_date", "Start Date *", "date")}
      {field("end_date", "End Date *", "date")}
      {field("start_time", "Start Time *", "time")}
      {field("end_time", "End Time *", "time")}
    </FormSection>,

    <FormSection title="Venue" key="venue">
      <div className="sm:col-span-2">{field("venue", "Venue Name *", "text", { placeholder: "e.g. Main Auditorium" })}</div>
      {field("building", "Building (optional)", "text", { placeholder: "e.g. Block A" })}
      {field("room", "Room Number (optional)", "text", { placeholder: "e.g. 301" })}
      <div className="sm:col-span-2">{field("google_map_url", "Google Maps URL (optional)", "url", { placeholder: "https://maps.google.com/..." })}</div>
    </FormSection>,

    <FormSection title="Registration" key="reg">
      <div className="sm:col-span-2 flex items-center gap-3">
        <input type="checkbox" id="reg_req" checked={form.registration_required}
          onChange={(e) => set("registration_required", e.target.checked)} className="w-4 h-4 accent-blue-600" />
        <label htmlFor="reg_req" className="text-sm text-gray-700">Registration Required?</label>
      </div>
      {form.registration_required && (
        <>
          <div className="sm:col-span-2">{field("registration_link", "Registration Link", "url", { placeholder: "https://forms.google.com/..." })}</div>
          {field("registration_deadline", "Registration Deadline (optional)", "date")}
          <div className="sm:col-span-2">
            <FileUploadField label="QR Code (optional)" accept=".png,.jpg,.jpeg" maxMB={5}
              uploadFn={uploadQR} preview={form.qr_code_url} onUpload={(url) => set("qr_code_url", url)} note="PNG, JPG · max 5MB" />
          </div>
        </>
      )}
    </FormSection>,

    <FormSection title="External Links (optional)" key="links">
      {field("website_url", "Website", "url", { placeholder: "https://..." })}
      {field("instagram_url", "Instagram", "url", { placeholder: "https://instagram.com/..." })}
      {field("linkedin_url", "LinkedIn", "url", { placeholder: "https://linkedin.com/..." })}
      {field("facebook_url", "Facebook", "url", { placeholder: "https://facebook.com/..." })}
      {field("whatsapp_url", "WhatsApp", "url", { placeholder: "https://wa.me/..." })}
      <div className="sm:col-span-2">
        <FileUploadField label="Brochure PDF (optional)" accept=".pdf" maxMB={10}
          uploadFn={uploadBrochure} preview={form.brochure_url} onUpload={(url) => set("brochure_url", url)} note="PDF · max 10MB" />
      </div>
    </FormSection>,

    <FormSection title="Target Audience" key="audience">
      <div className="sm:col-span-2">
        <AudienceSelector
          value={form.audience.length > 0 ? form.audience : [{ audience_type: "COLLEGE", college_id: "", program_id: "", year: "", custom_audience: "" }]}
          onChange={(audience) => set("audience", audience)}
          error={errors.audience}
        />
      </div>
    </FormSection>,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate("/events/my")} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
          ← My Requests
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Event Request</h1>

        <div className="flex gap-1 my-6">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} title={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-4 font-medium">{step + 1} / {SECTIONS.length} — {SECTIONS[step]}</p>

        <div className="min-h-[480px]">{sections[step]}</div>

        {serverError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 font-medium">{serverError}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">
              Back
            </button>
          )}
          {step < SECTIONS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Next
            </button>
          ) : (
            <Button loading={submitting} onClick={handleSubmit}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
