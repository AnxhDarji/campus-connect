import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateEventRequest } from "../middleware/eventValidators.js";
import {
  createEventRequest,
  getMyRequests,
  getEventRequest,
  updateEventRequest,
  deleteEventRequest,
  listPublishedEvents,
  toggleBookmark,
  myBookmarks,
  getFestivalEvents,
} from "../controllers/eventRequest.controller.js";
import {
  getCompletion,
  submitCompletion,
  retryReportGeneration,
} from "../controllers/eventCompletion.controller.js";
import { uploadCompletionPhotos, multerErrorHandler } from "../middleware/upload.js";

const router = Router();
const guard = [authMiddleware];

const photosUpload = (req, res, next) => {
  uploadCompletionPhotos(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  });
};

// Static routes first
router.post("/", ...guard, validateEventRequest, createEventRequest);
router.get("/", ...guard, listPublishedEvents);
router.get("/my", ...guard, getMyRequests);
router.get("/my-bookmarks", ...guard, myBookmarks);
router.get("/festivals/:name", ...guard, getFestivalEvents);

// Completion sub-routes (must be before /:id to avoid conflict)
router.get("/:id/completion", ...guard, getCompletion);
router.post("/:id/completion", ...guard, photosUpload, submitCompletion);
router.post("/:id/completion/report/retry", ...guard, retryReportGeneration);

// Dynamic :id routes
router.get("/:id", ...guard, getEventRequest);
router.post("/:id/bookmark", ...guard, toggleBookmark);
router.put("/:id", ...guard, validateEventRequest, updateEventRequest);
router.delete("/:id", ...guard, deleteEventRequest);

export default router;
