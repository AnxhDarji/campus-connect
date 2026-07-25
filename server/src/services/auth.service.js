import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";
import { determineRole } from "../utils/determineRole.js";
import { generateJWT } from "../utils/generateJWT.js";
import { generateOTP, hashOTP, compareOTP, createExpiryTime } from "./otpService.js";
import { sendOTPEmail } from "./emailService.js";

const MAX_RESEND_COUNT = 3;

export const register = async ({ fullName, email, institutionId, password }) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { institutionId: institutionId.toUpperCase() }],
  });

  if (existingUser) {
    const error = new Error("User already exists.");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const expiresAt = createExpiryTime(5);

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    {
      fullName,
      email: normalizedEmail,
      institutionId: institutionId.toUpperCase(),
      hashedPassword,
      hashedOTP,
      expiresAt,
      resendCount: 0,
    },
    { upsert: true, new: true }
  );

  await sendOTPEmail({ toEmail: normalizedEmail, toName: fullName, otp });

  return {
    success: true,
    message: "OTP sent to your email. Please verify to complete registration.",
  };
};

export const verifyOTP = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase();

  const pending = await PendingRegistration.findOne({ email: normalizedEmail });

  if (!pending) {
    const error = new Error("No pending registration found. Please sign up again.");
    error.status = 404;
    throw error;
  }

  if (new Date() > pending.expiresAt) {
    await PendingRegistration.deleteOne({ email: normalizedEmail });
    const error = new Error("OTP has expired. Please sign up again.");
    error.status = 410;
    throw error;
  }

  const isMatch = await compareOTP(otp, pending.hashedOTP);

  if (!isMatch) {
    const error = new Error("Invalid OTP.");
    error.status = 401;
    throw error;
  }

  const role = determineRole(normalizedEmail);

  const newUser = await User.create({
    fullName: pending.fullName,
    email: normalizedEmail,
    password: pending.hashedPassword,
    institutionId: pending.institutionId,
    role,
    isVerified: true,
    isActive: true,
  });

  await PendingRegistration.deleteOne({ email: normalizedEmail });

  const token = generateJWT({ id: newUser._id, role: newUser.role });

  return {
    success: true,
    message: "Account created successfully.",
    token,
  };
};

export const resendOTP = async ({ email }) => {
  const normalizedEmail = email.toLowerCase();

  const pending = await PendingRegistration.findOne({ email: normalizedEmail });

  if (!pending) {
    const error = new Error("No pending registration found. Please sign up again.");
    error.status = 404;
    throw error;
  }

  if (pending.resendCount >= MAX_RESEND_COUNT) {
    const error = new Error("Maximum OTP resend attempts reached. Please sign up again.");
    error.status = 429;
    throw error;
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const expiresAt = createExpiryTime(5);

  pending.hashedOTP = hashedOTP;
  pending.expiresAt = expiresAt;
  pending.resendCount += 1;
  await pending.save();

  await sendOTPEmail({ toEmail: normalizedEmail, toName: pending.fullName, otp });

  return {
    success: true,
    message: "A new OTP has been sent to your email.",
  };
};

export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been deactivated.");
    error.status = 401;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error("Please verify your email before logging in.");
    error.status = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const token = generateJWT({ id: user._id, role: user.role });

  return {
    success: true,
    message: "Logged in successfully!",
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    },
  };
};
