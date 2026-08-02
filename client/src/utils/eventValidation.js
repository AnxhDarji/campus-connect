const URL_RE = /^https?:\/\/.+\..+/;
const PHONE_RE = /^[6-9]\d{9}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateEventForm(form) {
  const errors = {};

  if (!form.requester_name?.trim()) errors.requester_name = "Requester name is required.";
  if (!form.requester_role) errors.requester_role = "Requester role is required.";
  if (form.requester_role === "Other" && !form.custom_role?.trim()) errors.custom_role = "Please specify your role.";
  if (!form.organization_type) errors.organization_type = "Organization type is required.";
  if (form.organization_type === "Other" && !form.organization_name?.trim()) errors.organization_name = "Organization name is required.";

  if (!form.contact_number?.trim()) errors.contact_number = "Contact number is required.";
  else if (!PHONE_RE.test(form.contact_number.trim())) errors.contact_number = "Enter a valid 10-digit Indian mobile number.";

  if (!form.email?.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email.";

  if (!form.title?.trim()) errors.title = "Title is required.";
  else if (form.title.trim().length < 5) errors.title = "Title must be at least 5 characters.";
  else if (form.title.trim().length > 120) errors.title = "Title must not exceed 120 characters.";

  if (!form.category) errors.category = "Category is required.";
  if (!form.department_id) errors.department_id = "Department is required.";

  if (!form.description && !form.poster_url) {
    errors.description = "Either a description or a poster is required.";
  } else if (form.description) {
    const words = form.description.trim().split(/\s+/).length;
    const min = form.poster_url ? 20 : 50;
    if (words < min) errors.description = `Description must be at least ${min} words.`;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!form.start_date) errors.start_date = "Start date is required.";
  else if (new Date(form.start_date) < today) errors.start_date = "Start date cannot be in the past.";

  if (!form.end_date) errors.end_date = "End date is required.";
  else if (form.start_date && new Date(form.end_date) < new Date(form.start_date)) errors.end_date = "End date cannot be before start date.";

  if (!form.start_time) errors.start_time = "Start time is required.";
  else if (!TIME_RE.test(form.start_time)) errors.start_time = "Invalid time format.";

  if (!form.end_time) errors.end_time = "End time is required.";
  else if (!TIME_RE.test(form.end_time)) errors.end_time = "Invalid time format.";
  else if (form.start_date === form.end_date && form.end_time <= form.start_time) {
    errors.end_time = "End time must be after start time on the same day.";
  }

  if (!form.venue?.trim()) errors.venue = "Venue is required.";

  if (form.registration_required) {
    if (form.registration_link && !URL_RE.test(form.registration_link)) {
      errors.registration_link = "Must be a valid URL.";
    }
  }

  const urlFields = ["google_map_url", "website_url", "instagram_url", "linkedin_url", "facebook_url", "whatsapp_url"];
  urlFields.forEach((f) => {
    if (form[f] && !URL_RE.test(form[f])) errors[f] = "Must be a valid URL.";
  });

  return errors;
}
