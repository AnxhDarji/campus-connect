import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventRequest, updateEventRequest, uploadPoster, uploadQR, uploadBrochure, getDepartments } from "../../services/eventService";
import { validateEventForm } from "../../utils/eventValidation";
import FormSection from "../../components/FormSection";
import FileUploadField from "../../components/FileUploadField";
import Button from "../../components/Button";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const AUDIENCE_TYPES = ["College", "Department", "Year"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];

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
        if (d.status !== "Pending Approval" && d.status !== "Rejected" && d.status !== "Returned for Changes") { navigate("/events/my"); return; }
        setForm({
          requester_name: d.requester_name || "",
          requester_role: d.requester_role || "",
          custom_role: d.custom_role || "",
          organization_type: d.organization_type || "",
          organization_name: d.organization_name || "",
          contact_number: d.contact_number || "",
          email: d.email || "",
          title: d.title || "", category: d.category || "", department_id: d.department_id?._id || "",
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

  const field = (name, label, type = "text", extra = {}) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>
      <input
        type={type} value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        {...extra}
      />
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const select = (name, label, options) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>
      <select value={form[name]} onChange={(e) => set(name, e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  const addAudience = () => setForm((p) => ({ ...p, audience: [...p.audience, { audience_type: "College", audience_value: "Entire College" }] }));
  const removeAudience = (i) => setForm((p) => ({ ...p, audience: p.audience.filter((_, idx) => idx !== i) }));
  const setAudience = (i, key, val) => setForm((p) => { const a = [...p.audience]; a[i] = { ...a[i], [key]: val }; return { ...p, audience: a }; });

  const handleSubmit = async () => {
    const errs = validateEventForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
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

  const SECTIONS = ["Requester Info", "Basic Info", "Description", "Schedule", "Venue", "Registration", "Links", "Audience"];

  const sections = [
    <FormSection title="Requester Information" key="requester">
      {field("requester_name", "Your Name *")}
      {select("requester_role", "Your Role *", REQUESTER_ROLES)}
      {form.requester_role === "Other" && (
        <div className="sm:col-span-2">{field("custom_role", "Please specify your role *")}</div>
      )}
      {select("organization_type", "Organization Type *", ORG_TYPES)}
      <div className="sm:col-span-2">{field("organization_name", "Organization Name")}</div>
      {field("contact_number", "Contact Number *", "tel")}
      {field("email", "Email Address *", "email")}
    </FormSection>,
    <FormSection title="Basic Information" key="basic">
      <div className="sm:col-span-2">{field("title", "Event Title *")}</div>
      {select("category", "Category *", CATEGORIES)}
      {select("department_id", "Department *", departments.map((d) => ({ value: d._id, label: d.name })))}
      <div className="sm:col-span-2">{field("club_name", "Club Name (optional)")}</div>
    </FormSection>,
    <FormSection title="Event Description" key="desc">
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Short Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
          className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
      <div className="sm:col-span-2">{field("venue", "Venue Name *")}</div>
      {field("building", "Building (optional)")}
      {field("room", "Room Number (optional)")}
      <div className="sm:col-span-2">{field("google_map_url", "Google Maps URL (optional)", "url")}</div>
    </FormSection>,
    <FormSection title="Registration" key="reg">
      <div className="sm:col-span-2 flex items-center gap-3">
        <input type="checkbox" id="reg_req" checked={form.registration_required} onChange={(e) => set("registration_required", e.target.checked)} className="w-4 h-4 accent-blue-600" />
        <label htmlFor="reg_req" className="text-sm text-gray-700">Registration Required?</label>
      </div>
      {form.registration_required && (
        <>
          <div className="sm:col-span-2">{field("registration_link", "Registration Link", "url")}</div>
          {field("registration_deadline", "Registration Deadline (optional)", "date")}
          <div className="sm:col-span-2">
            <FileUploadField label="QR Code (optional)" accept=".png,.jpg,.jpeg" maxMB={5}
              uploadFn={uploadQR} preview={form.qr_code_url} onUpload={(url) => set("qr_code_url", url)} note="PNG, JPG · max 5MB" />
          </div>
        </>
      )}
    </FormSection>,
    <FormSection title="External Links (optional)" key="links">
      {field("website_url", "Website", "url")}
      {field("instagram_url", "Instagram", "url")}
      {field("linkedin_url", "LinkedIn", "url")}
      {field("facebook_url", "Facebook", "url")}
      {field("whatsapp_url", "WhatsApp", "url")}
      <div className="sm:col-span-2">
        <FileUploadField label="Brochure PDF (optional)" accept=".pdf" maxMB={10}
          uploadFn={uploadBrochure} preview={form.brochure_url} onUpload={(url) => set("brochure_url", url)} note="PDF · max 10MB" />
      </div>
    </FormSection>,
    <FormSection title="Target Audience" key="audience">
      <div className="sm:col-span-2 flex flex-col gap-3">
        {form.audience.map((a, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select value={a.audience_type} onChange={(e) => setAudience(i, "audience_type", e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {AUDIENCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={a.audience_value} onChange={(e) => setAudience(i, "audience_value", e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => removeAudience(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        ))}
        <button type="button" onClick={addAudience} className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start">+ Add Audience</button>
      </div>
    </FormSection>,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate("/events/my")} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">← My Requests</button>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Event Request</h1>

        <div className="flex gap-1 mb-6">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} title={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-4 font-medium">{step + 1} / {SECTIONS.length} — {SECTIONS[step]}</p>

        <div className="min-h-[480px]">
          {sections[step]}
        </div>
        {serverError && <p className="text-xs text-red-500 mt-3">{serverError}</p>}

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
