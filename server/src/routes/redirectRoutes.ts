import { Router } from "express";
import { UrlController } from "../controllers/UrlController";
import { asyncHandler } from "../middleware";

const router = Router();

// GET /r/:shortCode - Redirect to original URL
router.get("/r/:shortCode", asyncHandler(UrlController.redirectUrl));

export default router;
