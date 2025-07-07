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

        return createdUrl;
    }

    /**
     * Retrieves a URL by short code or custom slug
     */
    static async getUrlByCode(code: string): Promise<UrlRecord | null> {
        const url = await db("urls")
            .where("short_code", code)
            .orWhere("custom_slug", code)
            .first();

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
        const url = await this.getUrlByCode(code);

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

        // Update click count and last accessed
        await db("urls")
            .where("id", url.id)
            .update({
                click_count: db.raw("click_count + 1"),
                last_accessed: new Date(),
            });

        // Track analytics (optional - only if analytics data provided)
        if (
            analyticsData.ip_address ||
            analyticsData.user_agent ||
            analyticsData.referer
        ) {
            await this.trackAnalytics(url.id, analyticsData);
        }

        return { redirectUrl, expired: false };
    }

    /**
     * Deletes a URL by ID
     */
    static async deleteUrl(id: string): Promise<boolean> {
        const deletedRows = await db("urls").where("id", id).del();
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

        return {
            url,
            analytics,
            summary: {
                totalClicks: url.click_count,
                uniqueClicks,
                clicksByDay,
            },
        };
    }

    /**
     * Private helper methods
     */
    private static async checkShortCodeExists(code: string): Promise<boolean> {
        const existing = await db("urls").where("short_code", code).first();
        return !!existing;
    }

    private static async checkSlugExists(slug: string): Promise<boolean> {
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
