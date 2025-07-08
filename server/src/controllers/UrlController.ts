/**
 * URL Controller - Handles HTTP requests for URL shortening
 */

import { Request, Response } from "express";
import { UrlService, CreateUrlParams } from "../services/UrlService";
import { isValidUuid } from "../utils/validators";

export class UrlController {
    /**
     * POST /api/shorten
     * Creates a new shortened URL
     */
    static async createShortUrl(req: Request, res: Response): Promise<void> {
        try {
            const { originalUrl, customSlug, expirationDate, utmParams } =
                req.body;

            // Validate required fields
            if (!originalUrl) {
                res.status(400).json({
                    error: "originalUrl is required",
                });
                return;
            }

            const params: CreateUrlParams = {
                originalUrl,
                customSlug,
                expirationDate,
                utmParams,
            };

            const url = await UrlService.createShortUrl(params);

            // Build the full short URL (frontend URL)
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const shortUrl = `${baseUrl}/${url.custom_slug || url.short_code}`;

            console.log("Backend - createShortUrl url object:", url);
            console.log(
                "Backend - url.short_code:",
                url.short_code,
                typeof url.short_code
            );
            console.log(
                "Backend - url.custom_slug:",
                url.custom_slug,
                typeof url.custom_slug
            );

            const responseData = {
                id: url.id,
                originalUrl: url.original_url,
                shortUrl,
                shortCode: url.short_code,
                customSlug: url.custom_slug,
                expirationDate: url.expiration_date,
                clickCount: url.click_count,
                createdAt: url.created_at,
            };

            console.log(
                "Backend - createShortUrl response data:",
                responseData
            );

            res.status(201).json({
                success: true,
                data: responseData,
            });
        } catch (error) {
            console.error("Error creating short URL:", error);

            res.status(400).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create short URL",
            });
        }
    }

    /**
     * GET /api/urls
     * Retrieves all URLs with pagination
     */
    static async getAllUrls(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(
                parseInt(req.query.limit as string) || 10,
                100
            ); // Max 100 per page

            const result = await UrlService.getAllUrls(page, limit);

            // Build full short URLs for response
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const urlsWithShortUrls = result.urls.map((url) => ({
                id: url.id,
                originalUrl: url.original_url,
                shortUrl: `${baseUrl}/${url.custom_slug || url.short_code}`,
                shortCode: url.short_code,
                customSlug: url.custom_slug,
                expirationDate: url.expiration_date,
                clickCount: url.click_count,
                lastAccessed: url.last_accessed,
                createdAt: url.created_at,
                updatedAt: url.updated_at,
            }));

            res.json({
                success: true,
                data: {
                    urls: urlsWithShortUrls,
                    pagination: {
                        page: result.page,
                        limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                },
            });
        } catch (error) {
            console.error("Error retrieving URLs:", error);

            res.status(500).json({
                error: "Failed to retrieve URLs",
            });
        }
    }

    /**
     * GET /api/urls/:id
     * Retrieves a specific URL by ID with analytics
     */
    static async getUrlById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    error: "URL ID is required",
                });
                return;
            }

            // Validate UUID format
            if (!isValidUuid(id)) {
                res.status(404).json({
                    error: "URL not found",
                });
                return;
            }

            const result = await UrlService.getUrlAnalytics(id);
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";

            res.json({
                success: true,
                data: {
                    url: {
                        id: result.url.id,
                        originalUrl: result.url.original_url,
                        shortUrl: `${baseUrl}/${
                            result.url.custom_slug || result.url.short_code
                        }`,
                        shortCode: result.url.short_code,
                        customSlug: result.url.custom_slug,
                        expirationDate: result.url.expiration_date,
                        clickCount: result.url.click_count,
                        lastAccessed: result.url.last_accessed,
                        createdAt: result.url.created_at,
                        updatedAt: result.url.updated_at,
                        utmParams: {
                            utm_source: result.url.utm_source,
                            utm_medium: result.url.utm_medium,
                            utm_campaign: result.url.utm_campaign,
                            utm_term: result.url.utm_term,
                            utm_content: result.url.utm_content,
                        },
                    },
                    analytics: {
                        summary: result.summary,
                        recentClicks: result.analytics.slice(0, 100), // Limit recent clicks
                    },
                },
            });
        } catch (error) {
            console.error("Error retrieving URL:", error);

            if (error instanceof Error && error.message === "URL not found") {
                res.status(404).json({
                    error: "URL not found",
                });
            } else {
                res.status(500).json({
                    error: "Failed to retrieve URL",
                });
            }
        }
    }

    /**
     * DELETE /api/urls/:id
     * Deletes a URL by ID
     */
    static async deleteUrl(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    error: "URL ID is required",
                });
                return;
            }

            // Validate UUID format
            if (!isValidUuid(id)) {
                res.status(404).json({
                    error: "URL not found",
                });
                return;
            }

            const deleted = await UrlService.deleteUrl(id);

            if (!deleted) {
                res.status(404).json({
                    error: "URL not found",
                });
                return;
            }

            res.json({
                success: true,
                message: "URL deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting URL:", error);

            res.status(500).json({
                error: "Failed to delete URL",
            });
        }
    }

    /**
     * GET /api/redirect/:shortCode
     * Gets redirect information for frontend handling
     */
    static async getRedirectInfo(req: Request, res: Response): Promise<void> {
        try {
            let { shortCode } = req.params;

            console.log(
                "Backend - getRedirectInfo called with shortCode:",
                shortCode
            );
            console.log("Backend - typeof shortCode:", typeof shortCode);
            console.log("Backend - req.params:", req.params);
            console.log("Backend - req.url:", req.url);

            // URL decode the shortCode to handle encoding issues
            if (shortCode) {
                try {
                    shortCode = decodeURIComponent(shortCode);
                    console.log("Backend - decoded shortCode:", shortCode);
                } catch (decodeError) {
                    console.error(
                        "Backend - Failed to decode shortCode:",
                        decodeError
                    );
                }
            }

            // Check for the [object Object] bug
            if (shortCode === "[object Object]") {
                console.error(
                    "Backend - Detected [object Object] as shortCode!"
                );
                res.status(400).json({
                    error: "Invalid short code format - received [object Object]",
                });
                return;
            }

            if (!shortCode) {
                res.status(400).json({
                    error: "Short code is required",
                });
                return;
            }

            // Gather analytics data
            const analyticsData = {
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get("User-Agent"),
                referer: req.get("Referer"),
            };

            const result = await UrlService.handleRedirect(
                shortCode,
                analyticsData
            );

            console.log(
                "Backend getRedirectInfo - result from UrlService:",
                result
            );
            console.log(
                "Backend getRedirectInfo - result.redirectUrl:",
                result.redirectUrl
            );
            console.log(
                "Backend getRedirectInfo - typeof result.redirectUrl:",
                typeof result.redirectUrl
            );

            if (result.expired) {
                res.status(410).json({
                    error: "This shortened URL has expired",
                });
                return;
            }

            // Return the redirect URL as JSON for frontend handling
            res.json({
                success: true,
                data: {
                    redirectUrl: result.redirectUrl,
                    shortCode: shortCode,
                },
            });
        } catch (error) {
            console.error("Error getting redirect info:", error);

            if (error instanceof Error && error.message === "URL not found") {
                res.status(404).json({
                    error: "Shortened URL not found",
                });
            } else {
                res.status(500).json({
                    error: "Failed to get redirect information",
                });
            }
        }
    }

    /**
     * GET /:shortCode
     * Handles URL redirection
     */
    static async redirectUrl(req: Request, res: Response): Promise<void> {
        try {
            let { shortCode } = req.params;

            console.log(
                "Backend redirectUrl - Original shortCode:",
                shortCode,
                typeof shortCode
            );
            console.log("Backend redirectUrl - req.params:", req.params);
            console.log("Backend redirectUrl - req.url:", req.url);
            console.log(
                "Backend redirectUrl - req.headers.host:",
                req.get("host")
            );

            // URL decode the shortCode to handle encoding issues
            if (shortCode) {
                try {
                    shortCode = decodeURIComponent(shortCode);
                    console.log(
                        "Backend redirectUrl - decoded shortCode:",
                        shortCode
                    );
                } catch (decodeError) {
                    console.error(
                        "Backend redirectUrl - Failed to decode shortCode:",
                        decodeError
                    );
                }
            }

            // Check for the [object Object] bug
            if (shortCode === "[object Object]") {
                console.error(
                    "Backend redirectUrl - Detected [object Object] as shortCode!"
                );
                res.status(400).send(`
                    <html>
                        <head><title>Invalid URL</title></head>
                        <body>
                            <h1>Invalid Short URL</h1>
                            <p>The URL contains an invalid short code: [object Object]</p>
                            <p>This indicates a bug in the application. Please contact support.</p>
                            <a href="http://localhost:3000">← Go to URL Shortener</a>
                        </body>
                    </html>
                `);
                return;
            }

            if (!shortCode) {
                res.status(400).send(`
                    <html>
                        <head><title>Missing Short Code</title></head>
                        <body>
                            <h1>Missing Short Code</h1>
                            <p>No short code was provided in the URL.</p>
                            <a href="http://localhost:3000">← Go to URL Shortener</a>
                        </body>
                    </html>
                `);
                return;
            }

            // Gather analytics data
            const analyticsData = {
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get("User-Agent"),
                referer: req.get("Referer"),
            };

            const result = await UrlService.handleRedirect(
                shortCode,
                analyticsData
            );

            if (result.expired) {
                res.status(410).json({
                    error: "This shortened URL has expired",
                });
                return;
            }

            // Redirect to the original URL
            res.redirect(301, result.redirectUrl);
        } catch (error) {
            console.error("Error redirecting URL:", error);

            if (error instanceof Error && error.message === "URL not found") {
                res.status(404).json({
                    error: "Shortened URL not found",
                });
            } else {
                res.status(500).json({
                    error: "Failed to redirect",
                });
            }
        }
    }

    /**
     * GET /api/urls/:id/analytics
     * Retrieves detailed analytics for a specific URL
     */
    static async getUrlAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    error: "URL ID is required",
                });
                return;
            }

            // Validate UUID format
            if (!isValidUuid(id)) {
                res.status(404).json({
                    error: "URL not found",
                });
                return;
            }

            const result = await UrlService.getUrlAnalytics(id);

            res.json({
                success: true,
                data: {
                    urlId: id,
                    analytics: {
                        summary: result.summary,
                        recentClicks: result.analytics.slice(0, 100), // Limit recent clicks
                    },
                },
            });
        } catch (error) {
            console.error("Error retrieving URL analytics:", error);

            if (error instanceof Error && error.message === "URL not found") {
                res.status(404).json({
                    error: "URL not found",
                });
            } else {
                res.status(500).json({
                    error: "Failed to retrieve analytics",
                });
            }
        }
    }
}
