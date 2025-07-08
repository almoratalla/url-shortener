/**
 * Advanced caching middleware for URL redirects
 * Implements intelligent caching strategies based on usage patterns
 */

import { Request, Response, NextFunction } from "express";
import { redirectCache, urlCache } from "../services/CacheService";
import { db } from "../db/knex";
import { buildUtmUrl } from "../utils/urlGenerator";

interface RequestPattern {
    shortCode: string;
    requestCount: number;
    lastAccessed: number;
    avgResponseTime: number;
}

// In-memory storage for request patterns
const requestPatterns = new Map<string, RequestPattern>();

/**
 * Middleware for intelligent redirect caching
 */
export function intelligentRedirectCache() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const shortCode = req.params.shortCode;

        if (!shortCode) {
            return next();
        }

        const startTime = Date.now();

        // Track request patterns
        const pattern = requestPatterns.get(shortCode) || {
            shortCode,
            requestCount: 0,
            lastAccessed: 0,
            avgResponseTime: 0,
        };

        pattern.requestCount++;
        pattern.lastAccessed = Date.now();
        requestPatterns.set(shortCode, pattern);

        // Check if this URL should be prioritized for caching
        const shouldPrioritizeCache = pattern.requestCount > 3; // URLs accessed more than 3 times

        if (shouldPrioritizeCache) {
            // Pre-cache related URLs if this is a popular URL
            setImmediate(() => precacheRelatedUrls(shortCode));
        }

        // Override res.json to track response times
        const originalJson = res.json;
        res.json = function (data: any) {
            const responseTime = Date.now() - startTime;

            // Update average response time
            pattern.avgResponseTime =
                (pattern.avgResponseTime + responseTime) / 2;
            requestPatterns.set(shortCode, pattern);

            // If response is slow, prioritize caching
            if (responseTime > 500) {
                // 500ms threshold
                setImmediate(() => prioritizeSlowUrls(shortCode));
            }

            return originalJson.call(this, data);
        };

        next();
    };
}

/**
 * Pre-cache URLs that are related or likely to be accessed together
 */
async function precacheRelatedUrls(shortCode: string): Promise<void> {
    try {
        // Get the current URL details
        const currentUrl = await db("urls")
            .where("short_code", shortCode)
            .orWhere("custom_slug", shortCode)
            .first();

        if (!currentUrl) return;

        // Find related URLs (same domain, similar UTM campaigns, etc.)
        const relatedUrls = await db("urls")
            .where(function () {
                // Same domain
                this.where(
                    "original_url",
                    "LIKE",
                    `%${new URL(currentUrl.original_url).hostname}%`
                )
                    // Or same UTM campaign
                    .orWhere("utm_campaign", currentUrl.utm_campaign)
                    // Or recently created by similar patterns
                    .orWhere("utm_source", currentUrl.utm_source);
            })
            .where("id", "!=", currentUrl.id)
            .limit(5);

        // Pre-cache these related URLs
        for (const url of relatedUrls) {
            const code = url.custom_slug || url.short_code;

            // Check if already cached
            const cached = await redirectCache.get(code);
            if (!cached) {
                // Build and cache the redirect URL
                let redirectUrl = url.original_url;

                const utmParams = {
                    utm_source: url.utm_source,
                    utm_medium: url.utm_medium,
                    utm_campaign: url.utm_campaign,
                    utm_term: url.utm_term,
                    utm_content: url.utm_content,
                };

                const hasUtmParams = Object.values(utmParams).some(
                    (value) => value
                );
                if (hasUtmParams) {
                    redirectUrl = buildUtmUrl(url.original_url, utmParams);
                }

                await redirectCache.set(code, redirectUrl);
                await urlCache.set(code, url);
            }
        }

        console.log(
            `🔗 Pre-cached ${relatedUrls.length} related URLs for popular shortCode: ${shortCode}`
        );
    } catch (error) {
        console.error("Error pre-caching related URLs:", error);
    }
}

/**
 * Prioritize caching for URLs that have slow response times
 */
async function prioritizeSlowUrls(shortCode: string): Promise<void> {
    try {
        const url = await db("urls")
            .where("short_code", shortCode)
            .orWhere("custom_slug", shortCode)
            .first();

        if (!url) return;

        // Build and cache the redirect URL with extended TTL
        let redirectUrl = url.original_url;

        const utmParams = {
            utm_source: url.utm_source,
            utm_medium: url.utm_medium,
            utm_campaign: url.utm_campaign,
            utm_term: url.utm_term,
            utm_content: url.utm_content,
        };

        const hasUtmParams = Object.values(utmParams).some((value) => value);
        if (hasUtmParams) {
            redirectUrl = buildUtmUrl(url.original_url, utmParams);
        }

        // Cache with longer TTL for slow URLs
        await redirectCache.set(shortCode, redirectUrl);
        await urlCache.set(shortCode, url);

        console.log(`⚡ Prioritized caching for slow URL: ${shortCode}`);
    } catch (error) {
        console.error("Error prioritizing slow URL caching:", error);
    }
}

/**
 * Get request pattern statistics
 */
export function getRequestPatternStats() {
    const patterns = Array.from(requestPatterns.values());

    return {
        totalPatterns: patterns.length,
        hotUrls: patterns.filter((p) => p.requestCount > 5).length,
        slowUrls: patterns.filter((p) => p.avgResponseTime > 500).length,
        patterns: patterns
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, 10), // Top 10 most accessed
    };
}

/**
 * Periodic cleanup of old request patterns
 */
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [shortCode, pattern] of requestPatterns.entries()) {
        if (pattern.lastAccessed < oneHourAgo && pattern.requestCount < 2) {
            requestPatterns.delete(shortCode);
        }
    }
}, 30 * 60 * 1000); // Clean up every 30 minutes
