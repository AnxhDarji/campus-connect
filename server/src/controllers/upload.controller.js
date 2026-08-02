import { uploadPoster, uploadQR, uploadBrochure, multerErrorHandler } from "../middleware/upload.js";

const handleUpload = (uploadMiddleware, field) => [
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return multerErrorHandler(err, req, res, next);
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
    const url = `/uploads/events/${req.file.filename}`;
    res.json({ success: true, url });
  },
];

export const uploadPosterHandler = handleUpload(uploadPoster, "poster");
export const uploadQRHandler = handleUpload(uploadQR, "qr");
export const uploadBrochureHandler = handleUpload(uploadBrochure, "brochure");
