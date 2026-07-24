import { USER_ROLES } from "../constants/userRoles.js";

export const determineRole = (email) => {
  if (email.endsWith("@charusat.edu.in")) {
    return USER_ROLES.STUDENT;
  }

  if (email.endsWith("@charusat.ac.in")) {
    return USER_ROLES.FACULTY;
  }

  throw new Error("Invalid email domain");
};