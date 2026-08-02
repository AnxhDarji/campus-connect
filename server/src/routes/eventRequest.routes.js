import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateEventRequest } from "../middleware/eventValidators.js";
import {
  createEventRequest,
  getMyRequests,
  getEventRequest,
  updateEventRequest,
  deleteEventRequest,
} from "../controllers/eventRequest.controller.js";

const router = Router();
const guard = [authMiddleware];

router.post("/", ...guard, validateEventRequest, createEventRequest);
router.get("/my", ...guard, getMyRequests);
router.get("/:id", ...guard, getEventRequest);
router.put("/:id", ...guard, validateEventRequest, updateEventRequest);
router.delete("/:id", ...guard, deleteEventRequest);

export default router;
