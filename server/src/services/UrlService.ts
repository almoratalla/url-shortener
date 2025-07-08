/**
 * URL Service - Business logic for URL shortening
 */

import { db } from "../db/knex";
import {
    generateUniqueShortCode,
    validateCustomSlug,
    buildUtmUrl,
} from "../utils/urlGenerator";
import {
    validateAndNormalizeUrl,
    validateExpirationDate,
    validateUtmParams,
    isUrlExpired,
} from "../utils/validators";
import {
    urlCache,
    analyticsCache,
    redirectCache,
    CachedUrl,
    CachedAnalytics,
} from "./CacheService";

export interface CreateUrlParams {
    originalUrl: string;
    customSlug?: string;
    expirationDate?: string | Date;
    utmParams?: {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_term?: string;
        utm_content?: string;
    };
}

export interface UrlRecord {
    id: string;
    original_url: string;
    short_code: string;
    custom_slug?: string;
    expiration_date?: Date;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    click_count: number;
    created_at: Date;
    updated_at: Date;
    last_accessed?: Date;
}

export class UrlService {
    /**
     * Creates a new shortened URL
     */
    static async createShortUrl(params: CreateUrlParams): Promise<UrlRecord> {
        const { originalUrl, customSlug, expirationDate, utmParams } = params;

        // Validate and normalize the original URL
        const normalizedUrl = validateAndNormalizeUrl(originalUrl);

        // Validate UTM parameters
        const validatedUtmParams = validateUtmParams(utmParams);

        // Validate expiration date if provided
        let validatedExpirationDate: Date | undefined;
        if (expirationDate) {
            validatedExpirationDate = validateExpirationDate(expirationDate);
        }

        // Handle custom slug or generate short code
        let shortCode: string;
        let validatedCustomSlug: string | null = null;

        if (customSlug) {
            validatedCustomSlug = validateCustomSlug(customSlug);

            // Check if custom slug already exists
            const existingSlug = await this.checkSlugExists(
                validatedCustomSlug
            );
            if (existingSlug) {
                throw new Error("Custom slug already exists");
            }
        }

        // Always generate a unique short code (8 characters)
        shortCode = await generateUniqueShortCode(this.checkShortCodeExists);

        // Create the URL record
        const urlData = {
            original_url: normalizedUrl,
            short_code: shortCode,
            custom_slug: validatedCustomSlug,
            expiration_date: validatedExpirationDate || null,
            ...validatedUtmParams,
            click_count: 0,
        };

        const [createdUrl] = await db("urls").insert(urlData).returning("*");

        // Cache the new URL (async, but don't wait)
        console.log(
            `📝 Caching new URL: shortCode=${createdUrl.short_code}, customSlug=${createdUrl.custom_slug}`
        );
        urlCache.set(createdUrl.short_code, createdUrl).catch(console.error);
        if (createdUrl.custom_slug) {
            urlCache
                .set(createdUrl.custom_slug, createdUrl)
                .catch(console.error);
        }

        return createdUrl;
    }

    /**
     * Retrieves a URL by short code or custom slug
     */
    static async getUrlByCode(code: string): Promise<UrlRecord | null> {
        // Check cache first
        const cachedUrl = await urlCache.get(code);
        if (cachedUrl) {
            return cachedUrl;
        }

        const url = await db("urls")
            .where("short_code", code)
            .orWhere("custom_slug", code)
            .first();

        if (url) {
            // Cache by short code
            urlCache.set(url.short_code, url).catch(console.error);
            // Also cache by custom slug if it exists
            if (url.custom_slug) {
                urlCache.set(url.custom_slug, url).catch(console.error);
            }
        }

        return url || null;
    }

    /**
     * Retrieves a URL by ID
     */
    static async getUrlById(id: string): Promise<UrlRecord | null> {
        const url = await db("urls").where("id", id).first();
        return url || null;
    }

    /**
     * Gets all URLs with pagination
     */
    static async getAllUrls(
        page: number = 1,
        limit: number = 10
    ): Promise<{
        urls: UrlRecord[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const offset = (page - 1) * limit;

        // Get total count
        const totalResult = await db("urls").count("id as count").first();
        const total = parseInt(totalResult?.count as string) || 0;

        // Get paginated URLs
        const urls = await db("urls")
            .select("*")
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);

        const totalPages = Math.ceil(total / limit);

        return {
            urls,
            total,
            page,
            totalPages,
        };
    }

    /**
     * Handles URL redirection and analytics tracking
     */
    static async handleRedirect(
        code: string,
        analyticsData: {
            ip_address?: string;
            user_agent?: string;
            referer?: string;
        }
    ): Promise<{ redirectUrl: string; expired: boolean }> {
        // Multi-layer caching strategy

        // 1. Check redirect cache first (fastest)
        const cachedRedirect = await redirectCache.get(code);
        if (cachedRedirect) {
            console.log(`🚀 Cache HIT for redirect: ${code}`);
            console.log(`🚀 Cached redirect type: ${typeof cachedRedirect}`);
            console.log(`🚀 Cached redirect value:`, cachedRedirect);

            // Validate that cached data is a string URL, not an object
            if (typeof cachedRedirect === 'string' && cachedRedirect.startsWith('http')) {
                // Still need to track analytics and update click count asynchronously
                setImmediate(async () => {
                    try {
                        const url = await this.getUrlByCode(code);
                        if (url) {
                            // Update click count and last accessed (async, don't wait)
                            await db("urls")
                                .where("id", url.id)
                                .update({
                                    click_count: db.raw("click_count + 1"),
                                    last_accessed: new Date(),
                                });

                            // Track analytics (async, don't wait)
                            if (
                                analyticsData.ip_address ||
                                analyticsData.user_agent ||
                                analyticsData.referer
                            ) {
                                await this.trackAnalytics(url.id, analyticsData);
                            }

                            // Update URL cache with fresh click count
                            const updatedUrl = {
                                ...url,
                                click_count: (url.click_count || 0) + 1,
                                last_accessed: new Date(),
                            };
                            await urlCache.set(code, updatedUrl);
                        }
                    } catch (error) {
                        console.error(
                            "Error updating analytics for cached redirect:",
                            error
                        );
                    }
                });

                return { redirectUrl: cachedRedirect, expired: false };
            } else {
                console.warn(`🚫 Invalid cached redirect data for ${code}, clearing cache and falling back to DB`);
                console.warn(`🚫 Invalid data:`, cachedRedirect);
                await redirectCache.delete(code);
                // Fall through to database lookup
            }
        }

        console.log(
            `💾 Cache MISS for redirect: ${code}, fetching from database`
        );

        // 2. Check URL cache before hitting database
        let url = await urlCache.get(code);
        if (!url) {
            // 3. Fallback to database
            url = await this.getUrlByCodeFromDB(code);
            if (url) {
                // Cache the URL for future requests
                await urlCache.set(code, url);
                // Also cache by custom slug if it exists
                if (url.custom_slug && url.custom_slug !== code) {
                    await urlCache.set(url.custom_slug, url);
                }
            }
        }

        if (!url) {
            throw new Error("URL not found");
        }

        // Check if URL has expired
        if (isUrlExpired(url.expiration_date || null)) {
            return { redirectUrl: "", expired: true };
        }

        // Build final URL with UTM parameters
        let redirectUrl = url.original_url;

        const utmParams = {
            utm_source: url.utm_source,
            utm_medium: url.utm_medium,
            utm_campaign: url.utm_campaign,
            utm_term: url.utm_term,
            utm_content: url.utm_content,
        };

        // Only add UTM params if at least one exists
        const hasUtmParams = Object.values(utmParams).some((value) => value);
        if (hasUtmParams) {
            redirectUrl = buildUtmUrl(url.original_url, utmParams);
        }

        // Cache the redirect URL for future requests with longer TTL for popular URLs
        const cacheTime = url.click_count && url.click_count > 10 ? 120 : 60; // 2 hours for popular, 1 hour for others
        console.log(
            `🔀 Caching redirect URL: code=${code}, redirectUrl=${redirectUrl}`
        );
        await redirectCache.set(code, redirectUrl);

        // Update click count and last accessed
        await db("urls")
            .where("id", url.id)
            .update({
                click_count: db.raw("click_count + 1"),
                last_accessed: new Date(),
            });

        // Invalidate analytics cache for this URL since we're updating stats
        analyticsCache.delete(url.id).catch(console.error);

        // Track analytics (optional - only if analytics data provided)
        if (
            analyticsData.ip_address ||
            analyticsData.user_agent ||
            analyticsData.referer
        ) {
            await this.trackAnalytics(url.id, analyticsData);
        }

        // Update URL cache with fresh click count
        const updatedUrl = {
            ...url,
            click_count: (url.click_count || 0) + 1,
            last_accessed: new Date(),
        };
        await urlCache.set(code, updatedUrl);

        return { redirectUrl, expired: false };
    }

    /**
     * Get URL by code from database (bypassing cache)
     */
    private static async getUrlByCodeFromDB(
        code: string
    ): Promise<CachedUrl | null> {
        const url = await db("urls")
            .where(function () {
                this.where("short_code", code).orWhere("custom_slug", code);
            })
            .first();

        return url || null;
    }

    /**
     * Deletes a URL by ID
     */
    static async deleteUrl(id: string): Promise<boolean> {
        const deletedRows = await db("urls").where("id", id).del();

        if (deletedRows > 0) {
            // Invalidate caches for the deleted URL
            const url = await db("urls").where("id", id).first();
            if (url) {
                urlCache.delete(url.short_code).catch(console.error);
                if (url.custom_slug) {
                    urlCache.delete(url.custom_slug).catch(console.error);
                    redirectCache.delete(url.custom_slug).catch(console.error);
                }
                redirectCache.delete(url.short_code).catch(console.error);
                analyticsCache.delete(id).catch(console.error);
            }
        }

        return deletedRows > 0;
    }

    /**
     * Gets analytics for a specific URL
     */
    static async getUrlAnalytics(urlId: string): Promise<{
        url: UrlRecord;
        analytics: any[];
        summary: {
            totalClicks: number;
            uniqueClicks: number;
            clicksByDay: any[];
        };
    }> {
        const url = await this.getUrlById(urlId);
        if (!url) {
            throw new Error("URL not found");
        }

        // Check cache for analytics data
        const cachedAnalytics = await analyticsCache.get(urlId);
        if (cachedAnalytics) {
            return cachedAnalytics;
        }

        // Get analytics data
        const analytics = await db("url_analytics")
            .where("url_id", urlId)
            .orderBy("clicked_at", "desc");

        // Get unique clicks (by IP address)
        const uniqueClicksResult = await db("url_analytics")
            .where("url_id", urlId)
            .countDistinct("ip_address as count")
            .first();

        const uniqueClicks = parseInt(uniqueClicksResult?.count as string) || 0;

        // Get clicks by day for the last 30 days
        const clicksByDay = await db("url_analytics")
            .where("url_id", urlId)
            .where("clicked_at", ">=", db.raw("NOW() - INTERVAL '30 days'"))
            .select(db.raw("DATE(clicked_at) as date"))
            .count("* as clicks")
            .groupBy(db.raw("DATE(clicked_at)"))
            .orderBy("date", "desc");

        const summary = {
            totalClicks: url.click_count,
            uniqueClicks,
            clicksByDay,
        };

        const result = { url, analytics, summary };

        // Cache the analytics data
        analyticsCache.set(urlId, result).catch(console.error);

        return result;
    }

    /**
     * Private helper methods
     */
    private static async checkShortCodeExists(code: string): Promise<boolean> {
        // Check cache first
        if (await urlCache.has(code)) {
            return true;
        }

        const existing = await db("urls").where("short_code", code).first();
        return !!existing;
    }

    private static async checkSlugExists(slug: string): Promise<boolean> {
        // Check cache first
        if (await urlCache.has(slug)) {
            return true;
        }

        const existing = await db("urls").where("custom_slug", slug).first();
        return !!existing;
    }

    private static async trackAnalytics(
        urlId: string,
        analyticsData: {
            ip_address?: string;
            user_agent?: string;
            referer?: string;
        }
    ): Promise<void> {
        try {
            await db("url_analytics").insert({
                url_id: urlId,
                ip_address: analyticsData.ip_address || null,
                user_agent: analyticsData.user_agent || null,
                referer: analyticsData.referer || null,
                clicked_at: new Date(),
            });
        } catch (error) {
            // Don't fail the redirect if analytics tracking fails
            console.error("Failed to track analytics:", error);
        }
    }
}
