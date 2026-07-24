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

  const newUser = await User.create({
    fullName: userData.fullName,
    email: userData.email,
    password: hashedPassword,
    institutionId: userData.institutionId,
    role,
    isVerified: false,
    isActive: true,
  });

  console.log("User Created:", newUser);

  const users = await User.find();
  console.log(users);
  
  return {
    success: true,
    message: "User registered successfully.",
  };
};