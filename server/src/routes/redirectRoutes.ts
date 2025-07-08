import { Router } from "express";
import { UrlController } from "../controllers/UrlController";
import { asyncHandler } from "../middleware";
import { intelligentRedirectCache } from "../middleware/cacheMiddleware";

const router = Router();

// GET /:shortCode - Direct redirect to original URL with intelligent caching
router.get(
    "/:shortCode",
    intelligentRedirectCache(),
    asyncHandler(UrlController.redirectUrl)
);

// GET /r/:shortCode - Alternative redirect route with intelligent caching
router.get(
    "/r/:shortCode",
    intelligentRedirectCache(),
    asyncHandler(UrlController.redirectUrl)
);

export default router;
