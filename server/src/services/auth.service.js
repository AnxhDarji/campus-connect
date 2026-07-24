import bcrypt from "bcryptjs";
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
    throw new Error("User already exists");
  }

  const role = determineRole(userData.email);

  // Hash Password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  console.log("Assigned Role:", role);
  console.log("Hashed Password:", hashedPassword);

  return {
    success: true,
    message: "Password hashed successfully.",
    role,
  };
};