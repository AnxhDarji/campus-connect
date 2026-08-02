import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { listRequests, getStats, getRequest, approveRequest, rejectRequest, editRequest } from "../controllers/admin.controller.js";

const router = Router();
const guard = [authMiddleware, authorizeRoles("Super Admin", "Dept Admin", "Admin")];

router.get("/event-requests/stats", ...guard, getStats);
router.get("/event-requests", ...guard, listRequests);
router.get("/event-requests/:id", ...guard, getRequest);
router.post("/event-requests/:id/approve", ...guard, approveRequest);
router.post("/event-requests/:id/reject", ...guard, rejectRequest);
router.patch("/event-requests/:id", ...guard, editRequest);

export default router;
