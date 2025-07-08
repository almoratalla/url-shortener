import { Router } from "express";
import { UrlController } from "../controllers/UrlController";
import { asyncHandler } from "../middleware";
import {
    intelligentRedirectCache,
    getRequestPatternStats,
} from "../middleware/cacheMiddleware";
import {
    urlCache,
    redirectCache,
    analyticsCache,
} from "../services/CacheService";

const router = Router();

// POST /api/shorten - Create short URL
router.post("/shorten", asyncHandler(UrlController.createShortUrl));

// GET /api/redirect/:shortCode - Get redirect info for frontend with intelligent caching
router.get(
    "/redirect/:shortCode",
    intelligentRedirectCache(),
    asyncHandler(UrlController.getRedirectInfo)
);

// GET /api/cache-stats - Get comprehensive cache statistics
router.get("/cache-stats", (req, res) => {
    const urlStats = urlCache.getStats();
    const redirectStats = redirectCache.getStats();
    const analyticsStats = analyticsCache.getStats();
    const patternStats = getRequestPatternStats();

    res.json({
        success: true,
        data: {
            cachePerformance: {
                url: {
                    hitRate: `${urlStats.hitRate.toFixed(2)}%`,
                    hits: urlStats.hits,
                    misses: urlStats.misses,
                    totalRequests: urlStats.totalRequests,
                    redisConnected: urlStats.redisConnected,
                    fallbackActive: urlStats.fallbackActive,
                },
                redirect: {
                    hitRate: `${redirectStats.hitRate.toFixed(2)}%`,
                    hits: redirectStats.hits,
                    misses: redirectStats.misses,
                    totalRequests: redirectStats.totalRequests,
                    redisConnected: redirectStats.redisConnected,
                    fallbackActive: redirectStats.fallbackActive,
                },
                analytics: {
                    hitRate: `${analyticsStats.hitRate.toFixed(2)}%`,
                    hits: analyticsStats.hits,
                    misses: analyticsStats.misses,
                    totalRequests: analyticsStats.totalRequests,
                    redisConnected: analyticsStats.redisConnected,
                    fallbackActive: analyticsStats.fallbackActive,
                },
            },
            requestPatterns: patternStats,
            timestamp: new Date().toISOString(),
        },
    });
});

// GET /api/urls - Get all URLs for user (with pagination)
router.get("/urls", asyncHandler(UrlController.getAllUrls));

// GET /api/urls/:id - Get single URL by ID
router.get("/urls/:id", asyncHandler(UrlController.getUrlById));

// DELETE /api/urls/:id - Delete URL by ID
router.delete("/urls/:id", asyncHandler(UrlController.deleteUrl));

// GET /api/urls/:id/analytics - Get URL analytics
router.get("/urls/:id/analytics", asyncHandler(UrlController.getUrlAnalytics));

export default router;
