import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = "uploads/events";
    ensureDir(dir);
    cb(null, dir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const POSTER_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const QR_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const BROCHURE_TYPES = ["application/pdf"];

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Invalid file type: ${file.mimetype}`), false);
};

export const uploadPoster = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(POSTER_TYPES),
}).single("poster");

export const uploadQR = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(QR_TYPES),
}).single("qr");

export const uploadBrochure = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(BROCHURE_TYPES),
}).single("brochure");

export const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.startsWith("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};
