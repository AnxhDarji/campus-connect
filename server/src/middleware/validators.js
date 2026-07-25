import { body, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

export const validateRegister = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required.")
    .matches(/^[a-zA-Z ]+$/).withMessage("Full name can only contain letters and spaces.")
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be between 3 and 100 characters."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email format.")
    .custom((value) => {
      if (!value.toLowerCase().endsWith("@charusat.edu.in")) {
        throw new Error("Only Charusat email (@charusat.edu.in) is allowed.");
      }
      return true;
    }),

  body("institutionId")
    .trim()
    .notEmpty().withMessage("Institution ID is required."),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage("Password must contain at least one special character."),

  handleValidationErrors,
];

export const validateVerifyOTP = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email format."),

  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required.")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits.")
    .isNumeric().withMessage("OTP must be numeric."),

  handleValidationErrors,
];

export const validateResendOTP = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email format."),

  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email format."),

  body("password")
    .notEmpty().withMessage("Password is required."),

  handleValidationErrors,
];
