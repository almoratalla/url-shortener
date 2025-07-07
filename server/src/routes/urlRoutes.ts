import { Router } from "express";
import { UrlController } from "../controllers/UrlController";
import { asyncHandler } from "../middleware";

const router = Router();

// POST /api/shorten - Create short URL
router.post("/shorten", asyncHandler(UrlController.createShortUrl));

// GET /api/urls - Get all URLs for user (with pagination)
router.get("/urls", asyncHandler(UrlController.getAllUrls));

// GET /api/urls/:id - Get single URL by ID
router.get("/urls/:id", asyncHandler(UrlController.getUrlById));

// DELETE /api/urls/:id - Delete URL by ID
router.delete("/urls/:id", asyncHandler(UrlController.deleteUrl));

// GET /api/urls/:id/analytics - Get URL analytics
router.get("/urls/:id/analytics", asyncHandler(UrlController.getUrlAnalytics));

export default router;
