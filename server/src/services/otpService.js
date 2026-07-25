import crypto from "crypto";
import bcrypt from "bcryptjs";

export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

export const compareOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};

export const createExpiryTime = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
