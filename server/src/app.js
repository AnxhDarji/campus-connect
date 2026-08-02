import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import eventRequestRoutes from "./routes/eventRequest.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/event-requests", eventRequestRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CampusConnect API Running!!!",
  });
});

app.use(errorHandler);

export default app;
