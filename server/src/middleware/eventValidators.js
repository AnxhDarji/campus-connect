import { body } from "express-validator";
import { handleValidationErrors } from "./validators.js";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];

const urlField = (field) =>
  body(field).optional({ nullable: true, checkFalsy: true }).isURL().withMessage(`${field} must be a valid URL.`);

export const validateEventRequest = [
  body("requester_name").trim().notEmpty().withMessage("Requester name is required."),

  body("requester_role").notEmpty().withMessage("Requester role is required.")
    .isIn(REQUESTER_ROLES).withMessage("Invalid requester role."),

  body("custom_role").if(body("requester_role").equals("Other"))
    .trim().notEmpty().withMessage("Please specify your role."),

  body("organization_type").notEmpty().withMessage("Organization type is required.")
    .isIn(ORG_TYPES).withMessage("Invalid organization type."),

  body("organization_name").if(body("organization_type").equals("Other"))
    .trim().notEmpty().withMessage("Organization name is required."),

  body("contact_number").trim().notEmpty().withMessage("Contact number is required.")
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number."),

  body("email").trim().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Enter a valid email address."),

  body("title").trim().notEmpty().withMessage("Event title is required.")
    .isLength({ min: 5 }).withMessage("Title must be at least 5 characters.")
    .isLength({ max: 120 }).withMessage("Title must not exceed 120 characters."),

  body("category").notEmpty().withMessage("Category is required.")
    .isIn(CATEGORIES).withMessage("Invalid category."),

  body("department_id").notEmpty().withMessage("Department is required.")
    .isMongoId().withMessage("Invalid department ID."),

  body("start_date").notEmpty().withMessage("Start date is required.")
    .isISO8601().withMessage("Invalid start date.")
    .custom((val) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(val) < today) throw new Error("Start date cannot be in the past.");
      return true;
    }),

  body("end_date").notEmpty().withMessage("End date is required.")
    .isISO8601().withMessage("Invalid end date.")
    .custom((val, { req }) => {
      if (new Date(val) < new Date(req.body.start_date)) throw new Error("End date cannot be before start date.");
      return true;
    }),

  body("start_time").notEmpty().withMessage("Start time is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Invalid start time format (HH:MM)."),

  body("end_time").notEmpty().withMessage("End time is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Invalid end time format (HH:MM).")
    .custom((val, { req }) => {
      if (req.body.start_date === req.body.end_date && val <= req.body.start_time) {
        throw new Error("End time must be after start time on the same day.");
      }
      return true;
    }),

  body("venue").trim().notEmpty().withMessage("Venue is required."),

  body("registration_required").optional().isBoolean(),

  body("registration_link").optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage("Registration link must be a valid URL."),

  urlField("google_map_url"),
  urlField("website_url"),
  urlField("instagram_url"),
  urlField("linkedin_url"),
  urlField("facebook_url"),
  urlField("whatsapp_url"),

  body("audience").optional().isArray().withMessage("Audience must be an array."),
  body("audience.*.audience_type").optional().isIn(["College", "Department", "Year"]).withMessage("Invalid audience type."),
  body("audience.*.audience_value").optional().notEmpty().withMessage("Audience value is required."),

  handleValidationErrors,
];
