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

const router = Router();
const guard = [authMiddleware];

router.post("/", ...guard, validateEventRequest, createEventRequest);
router.get("/", ...guard, listPublishedEvents);
router.get("/my", ...guard, getMyRequests);
router.get("/my-bookmarks", ...guard, myBookmarks);
router.get("/festivals/:name", ...guard, getFestivalEvents);
router.get("/:id", ...guard, getEventRequest);
router.post("/:id/bookmark", ...guard, toggleBookmark);
router.put("/:id", ...guard, validateEventRequest, updateEventRequest);
router.delete("/:id", ...guard, deleteEventRequest);

export default router;
