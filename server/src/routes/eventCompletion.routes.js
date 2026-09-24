import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadCompletionPhotos, multerErrorHandler } from "../middleware/upload.js";
import {
  getCompletion,
  submitCompletion,
  retryReportGeneration,
  generatePoster,
  approvePoster,
} from "../controllers/eventCompletion.controller.js";

const router = Router({ mergeParams: true });
const guard = [authMiddleware];

// Multer handler for completion photos
const photosUpload = (req, res, next) => {
  uploadCompletionPhotos(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  });
};

router.get("/", ...guard, getCompletion);
router.post("/", ...guard, photosUpload, submitCompletion);
router.post("/report/retry", ...guard, retryReportGeneration);
router.post("/generate-poster", ...guard, generatePoster);
router.post("/regenerate-poster", ...guard, generatePoster);
router.patch("/approve-poster", ...guard, approvePoster);

export default router;
