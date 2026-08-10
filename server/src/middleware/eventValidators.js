import { body } from "express-validator";
import { handleValidationErrors } from "./validators.js";
import { CHARUSAT_DATA } from "../../shared/charusatData.js";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];
const AUDIENCE_TYPES = ["COLLEGE", "PROGRAM", "YEAR", "OTHER"];

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

  body("organization_email").trim().notEmpty().withMessage("Organization email is required.")
    .isEmail().withMessage("Enter a valid organization email address."),

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
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(val) < today) throw new Error("End date cannot be in the past.");
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

  body("registration_deadline").optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("Invalid registration deadline.")
    .custom((val, { req }) => {
      if (!val) return true;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(val) < today) throw new Error("Registration deadline cannot be in the past.");
      if (req.body.start_date && new Date(val) > new Date(req.body.start_date)) {
        throw new Error("Registration deadline cannot be after the event start date.");
      }
      return true;
    }),

  urlField("google_map_url"),
  urlField("website_url"),
  urlField("instagram_url"),
  urlField("linkedin_url"),
  urlField("facebook_url"),
  urlField("whatsapp_url"),

  body("audience").optional().isArray().withMessage("Audience must be an array."),
  body("audience.*.audience_type").optional().isIn(AUDIENCE_TYPES).withMessage("Invalid audience type."),
  body("audience.*.college_id").optional({ nullable: true, checkFalsy: true }).isString(),
  body("audience.*.program_id").optional({ nullable: true, checkFalsy: true })
    .custom((programId, { req, path }) => {
      if (!programId) return true;
      // Extract index from path like "audience[0].program_id"
      const match = path.match(/audience\[(\d+)\]/);
      if (!match) return true;
      const idx = parseInt(match[1]);
      const entry = req.body.audience?.[idx];
      if (!entry?.college_id) throw new Error("program_id requires a valid college_id.");
      const college = CHARUSAT_DATA.find((c) => c.id === entry.college_id);
      if (!college) throw new Error("Invalid college_id.");
      const program = college.programs.find((p) => p.id === programId);
      if (!program) throw new Error("program_id does not belong to the selected college.");
      return true;
    }),
  body("audience.*.year").optional({ nullable: true, checkFalsy: true })
    .custom((year, { req, path }) => {
      if (!year) return true;
      const match = path.match(/audience\[(\d+)\]/);
      if (!match) return true;
      const idx = parseInt(match[1]);
      const entry = req.body.audience?.[idx];
      if (!entry?.college_id || !entry?.program_id) throw new Error("year requires college_id and program_id.");
      const college = CHARUSAT_DATA.find((c) => c.id === entry.college_id);
      const program = college?.programs.find((p) => p.id === entry.program_id);
      if (!program) throw new Error("Invalid program for year validation.");
      const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];
      const validYears = Array.from({ length: program.duration }, (_, i) => `${ordinals[i] ?? `${i + 1}th`} Year`);
      if (!validYears.includes(year)) throw new Error(`Invalid year "${year}" for this program.`);
      return true;
    }),
  body("audience.*.custom_audience").optional({ nullable: true, checkFalsy: true })
    .custom((val, { req, path }) => {
      const match = path.match(/audience\[(\d+)\]/);
      if (!match) return true;
      const idx = parseInt(match[1]);
      const entry = req.body.audience?.[idx];
      if (entry?.audience_type === "OTHER" && !val?.trim()) {
        throw new Error("Custom audience description is required for OTHER type.");
      }
      return true;
    }),

  handleValidationErrors,
];
