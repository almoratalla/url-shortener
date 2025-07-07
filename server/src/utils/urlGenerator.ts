/**
 * URL Generator utility functions
 */

/**
 * Generates a random 8-character alphanumeric short code
 * @returns {string} 8-character short code
 */
export function generateShortCode(): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

/**
 * Generates a unique short code by checking database for conflicts
 * @param {Function} checkExists - Function to check if code exists in database
 * @param {number} maxAttempts - Maximum attempts to generate unique code
 * @returns {Promise<string>} Unique 8-character short code
 */
export async function generateUniqueShortCode(
    checkExists: (code: string) => Promise<boolean>,
    maxAttempts: number = 10
): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateShortCode();
        const exists = await checkExists(code);

        if (!exists) {
            return code;
        }
    }

    throw new Error(
        "Failed to generate unique short code after maximum attempts"
    );
}

/**
 * Validates and formats a custom slug
 * @param {string} slug - Custom slug to validate
 * @returns {string} Formatted slug
 * @throws {Error} If slug is invalid
 */
export function validateCustomSlug(slug: string): string {
    if (!slug || typeof slug !== "string") {
        throw new Error("Custom slug must be a non-empty string");
    }

    // Remove leading/trailing whitespace and convert to lowercase
    const formatted = slug.trim().toLowerCase();

    // Check length
    if (formatted.length < 3 || formatted.length > 50) {
        throw new Error("Custom slug must be between 3 and 50 characters");
    }

    // Check format - only alphanumeric, hyphens, and underscores
    if (!/^[a-z0-9_-]+$/.test(formatted)) {
        throw new Error(
            "Custom slug can only contain letters, numbers, hyphens, and underscores"
        );
    }

    // Don't allow reserved words
    const reserved = ["api", "admin", "www", "app", "help", "support", "docs"];
    if (reserved.includes(formatted)) {
        throw new Error("Custom slug cannot use reserved words");
    }

    return formatted;
}

/**
 * Builds a URL with UTM parameters
 * @param {string} baseUrl - Base URL to append UTM parameters to
 * @param {object} utmParams - UTM parameters object
 * @returns {string} URL with UTM parameters
 */
export function buildUtmUrl(
    baseUrl: string,
    utmParams: {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_term?: string;
        utm_content?: string;
    }
): string {
    const url = new URL(baseUrl);
    const originalHasQuery = url.search.length > 0;

    // Add UTM parameters if they exist
    Object.entries(utmParams).forEach(([key, value]) => {
        if (value && value.trim()) {
            url.searchParams.set(key, value.trim());
        }
    });

    const result = url.toString();

    // Remove trailing slash only if the original URL had no query parameters
    // and we're adding query parameters for the first time
    if (!originalHasQuery && url.pathname === "/" && url.search) {
        return result.replace("/?", "?");
    }

    return result;
}
