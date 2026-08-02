import dotenv from "dotenv";
import mongoose from "mongoose";
import Department from "../src/models/Department.js";

dotenv.config();

const departments = [
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

await mongoose.connect(process.env.MONGODB_URI);
await Department.deleteMany({});
await Department.insertMany(departments);
console.log("Departments seeded.");
await mongoose.disconnect();
