import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

const Department = mongoose.model("Department", departmentSchema);
export default Department;
