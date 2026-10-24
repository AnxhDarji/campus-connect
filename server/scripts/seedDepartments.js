import dotenv from "dotenv";
import mongoose from "mongoose";
import Department from "../src/models/Department.js";
import { CHARUSAT_DATA } from "../../client/src/utils/charusatData.js";

dotenv.config();

const existingDepartments = [
  { name: "Computer Engineering", code: "CE" },
  { name: "Information Technology", code: "IT" },
  { name: "Electronics & Communication", code: "EC" },
  { name: "Mechanical Engineering", code: "ME" },
  { name: "Civil Engineering", code: "CV" },
  { name: "Electrical Engineering", code: "EE" },
  { name: "Chemical Engineering", code: "CH" },
  { name: "Biotechnology", code: "BT" },
  { name: "MBA", code: "MBA" },
  { name: "MCA", code: "MCA" },
];

const instituteDepartments = CHARUSAT_DATA.map(({ id, fullName }) => ({
  name: fullName,
  code: id,
}));
const departments = [...existingDepartments, ...instituteDepartments];
const departmentCodes = new Set();
for (const { code } of departments) {
  if (departmentCodes.has(code)) {
    throw new Error(`Duplicate department code in catalog: ${code}`);
  }
  departmentCodes.add(code);
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  await Department.bulkWrite(departments.map((department) => ({
    updateOne: {
      filter: { code: department.code },
      update: { $setOnInsert: department },
      upsert: true,
    },
  })));
  console.log(`${departments.length} department options ensured; existing records preserved.`);
} finally {
  await mongoose.disconnect();
}
