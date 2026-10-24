const URL_RE = /^https?:\/\/.+\..+/;
const PHONE_RE = /^[6-9]\d{9}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validatePhone = (v) => {
  if (!v?.trim()) return "Contact number is required.";
  if (!PHONE_RE.test(v.trim())) return "Enter a valid 10-digit mobile number.";
  return "";
};

export const validateEmail = (v) => {
  if (!v?.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address.";
  return "";
};

export const validateOrgEmail = (v) => {
  const t = (v || "").trim();
  if (!t) return "Organization email is required.";
  if (!EMAIL_RE.test(t)) return "Enter a valid organization email address.";
  return "";
};

export const validateStartDate = (v) => {
  if (!v) return "Start date is required.";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(v) < today) return "Start date cannot be in the past.";
  return "";
};

export const validateEndDate = (v, startDate) => {
  if (!v) return "End date is required.";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(v) < today) return "End date cannot be in the past.";
  if (startDate && new Date(v) < new Date(startDate)) return "End date cannot be before the start date.";
  return "";
};

export const validateRegistrationDeadline = (v, startDate) => {
  if (!v) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(v) < today) return "Registration deadline cannot be in the past.";
  if (startDate && new Date(v) > new Date(startDate)) return "Deadline cannot be after the event start date.";
  return "";
};

// Per-step validation — returns error map for fields on that step only
export function validateStep(step, form) {
  const errors = {};

  if (step === 0) {
    if (!form.requester_role) errors.requester_role = "Your role is required.";
    if (form.requester_role === "Other" && !form.custom_role?.trim()) errors.custom_role = "Please specify your role.";
    if (!form.organization_type) errors.organization_type = "Organization type is required.";
    const phoneErr = validatePhone(form.contact_number);
    if (phoneErr) errors.contact_number = phoneErr;
    const orgEmailErr = validateOrgEmail(form.organization_email);
    if (orgEmailErr) errors.organization_email = orgEmailErr;
  }

  if (step === 1) {
    if (!form.title?.trim()) errors.title = "Event title is required.";
    else if (form.title.trim().length < 5) errors.title = "Title must be at least 5 characters.";
    else if (form.title.trim().length > 120) errors.title = "Title must not exceed 120 characters.";
    if (!form.category) errors.category = "Category is required.";
    if (!form.department_id) errors.department_id = "Department is required.";
    const desc = form.description?.trim() || "";
    const words = desc ? desc.split(/\s+/).length : 0;
    const minWords = form.poster_url ? 20 : 50;
    if (!desc && !form.poster_url) {
      errors.description = "Add a description or upload an event poster.";
    } else if (desc && words < minWords) {
      errors.description = `Description must be at least ${minWords} words${form.poster_url ? "" : " (or upload a poster to reduce to 20)"}.`;
    }
  }

  if (step === 2) {
    const startErr = validateStartDate(form.start_date);
    if (startErr) errors.start_date = startErr;
    const endErr = validateEndDate(form.end_date, form.start_date);
    if (endErr) errors.end_date = endErr;
    if (!form.start_time) errors.start_time = "Start time is required.";
    else if (!TIME_RE.test(form.start_time)) errors.start_time = "Invalid time format.";
    if (!form.end_time) errors.end_time = "End time is required.";
    else if (!TIME_RE.test(form.end_time)) errors.end_time = "Invalid time format.";
    else if (form.start_date === form.end_date && form.end_time <= form.start_time) {
      errors.end_time = "End time must be after start time on the same day.";
    }
    if (!form.venue?.trim()) errors.venue = "Venue is required.";
    if (form.google_map_url && !URL_RE.test(form.google_map_url)) errors.google_map_url = "Must be a valid URL.";
  }

  if (step === 3) {
    if (form.registration_required) {
      if (form.registration_link && !URL_RE.test(form.registration_link)) {
        errors.registration_link = "Must be a valid URL.";
      }
      if (form.registration_deadline) {
        const dlErr = validateRegistrationDeadline(form.registration_deadline, form.start_date);
        if (dlErr) errors.registration_deadline = dlErr;
      }
    }
    const urlFields = ["website_url", "instagram_url", "linkedin_url", "facebook_url", "whatsapp_url"];
    urlFields.forEach((f) => {
      if (form[f] && !URL_RE.test(form[f])) errors[f] = "Must be a valid URL.";
    });
  }

  return errors;
}

// Full form validation (used on final submit as safety net)
export function validateEventForm(form) {
  return {
    ...validateStep(0, form),
    ...validateStep(1, form),
    ...validateStep(2, form),
    ...validateStep(3, form),
  };
}
