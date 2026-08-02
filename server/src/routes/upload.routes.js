import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadPosterHandler, uploadQRHandler, uploadBrochureHandler } from "../controllers/upload.controller.js";

const router = Router();
const guard = [authMiddleware];

router.post("/poster", ...guard, ...uploadPosterHandler);
router.post("/qr", ...guard, ...uploadQRHandler);
router.post("/brochure", ...guard, ...uploadBrochureHandler);

export default router;
