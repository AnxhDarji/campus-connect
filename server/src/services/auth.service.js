import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { determineRole } from "../utils/determineRole.js";

export const register = async (userData) => {
  const existingUser = await User.findOne({
    $or: [
      { email: userData.email },
      { institutionId: userData.institutionId },
    ],
  });

  if (existingUser) {
    const error = new Error("User already exists");
    error.status = 400;
    throw error;
  }

  const role = determineRole(userData.email);

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  await User.create({
    fullName: userData.fullName,
    email: userData.email,
    password: hashedPassword,
    institutionId: userData.institutionId,
    role,
    isVerified: false,
    isActive: true,
  });

  return {
    success: true,
    message: "User registered successfully.",
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

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

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

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
