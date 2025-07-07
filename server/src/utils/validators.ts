/**
 * URL validation utility functions
 */

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Only allow http and https protocols
        if (!["http:", "https:"].includes(urlObj.protocol)) {
            return false;
        }

        // Must have a hostname
        if (!urlObj.hostname) {
            return false;
        }

        // Hostname must contain at least one dot (for domain validation)
        if (!urlObj.hostname.includes(".")) {
            return false;
        }

        // Reject localhost and private IPs in production
        const hostname = urlObj.hostname.toLowerCase();
        if (process.env.NODE_ENV === "production") {
            if (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.startsWith("192.168.") ||
                hostname.startsWith("10.") ||
                hostname.startsWith("172.")
            ) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Validates and normalizes a URL
 * @param {string} url - URL to validate and normalize
 * @returns {string} Normalized URL
 * @throws {Error} If URL is invalid
 */
export function validateAndNormalizeUrl(url: string): string {
    if (!url || typeof url !== "string") {
        throw new Error("URL is required");
    }

    let normalizedUrl = url.trim();

    // Add https:// if no protocol is specified
    if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = "https://" + normalizedUrl;
    }

    // Check URL length before validation
    if (normalizedUrl.length > 2000) {
        throw new Error("URL is too long (max 2000 characters)");
    }

    try {
        const urlObj = new URL(normalizedUrl);

        // Only allow http and https protocols
        if (!["http:", "https:"].includes(urlObj.protocol)) {
            throw new Error("URL must use HTTP or HTTPS protocol");
        }

        // Must have a hostname
        if (!urlObj.hostname) {
            throw new Error("Invalid URL format");
        }

        // Reject localhost and private IPs in production
        const hostname = urlObj.hostname.toLowerCase();
        if (process.env.NODE_ENV === "production") {
            if (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.startsWith("192.168.") ||
                hostname.startsWith("10.") ||
                hostname.startsWith("172.")
            ) {
                throw new Error("Localhost URLs are not allowed in production");
            }
        }

        // Hostname must contain at least one dot (for domain validation), except for localhost
        const isLocalhost =
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172.");

        if (!isLocalhost && !urlObj.hostname.includes(".")) {
            throw new Error("Invalid URL format");
        }

        return normalizedUrl;
    } catch (error) {
        if (error instanceof Error && error.message.includes("protocol")) {
            throw error;
        }
        if (error instanceof Error && error.message.includes("Localhost")) {
            throw error;
        }
        throw new Error("Invalid URL format");
    }
}

/**
 * Validates expiration date
 * @param {string | Date} expirationDate - Expiration date to validate
 * @returns {Date} Validated expiration date
 * @throws {Error} If expiration date is invalid
 */
export function validateExpirationDate(expirationDate: string | Date): Date {
    let expDate: Date;

    if (typeof expirationDate === "string") {
        expDate = new Date(expirationDate);
    } else if (expirationDate instanceof Date) {
        expDate = expirationDate;
    } else {
        throw new Error(
            "Expiration date must be a valid date string or Date object"
        );
    }

    if (isNaN(expDate.getTime())) {
        throw new Error("Invalid expiration date format");
    }

    // Check if expiration date is in the future
    if (expDate <= new Date()) {
        throw new Error("Expiration date must be in the future");
    }

    // Limit expiration to 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (expDate > oneYearFromNow) {
        throw new Error("Expiration date cannot be more than 1 year from now");
    }

    return expDate;
}

/**
 * Validates UTM parameters
 * @param {object} utmParams - UTM parameters to validate
 * @returns {object} Validated UTM parameters
 */
export function validateUtmParams(utmParams: any): {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
} {
    if (!utmParams || typeof utmParams !== "object") {
        return {};
    }

    const validatedParams: any = {};
    const allowedParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
    ];

    // Check for invalid parameter names
    Object.keys(utmParams).forEach((param) => {
        if (!allowedParams.includes(param)) {
            throw new Error(`Invalid UTM parameter: ${param}`);
        }
    });

    allowedParams.forEach((param) => {
        if (utmParams[param] !== undefined) {
            if (typeof utmParams[param] !== "string") {
                return; // Skip non-string values
            }

            const value = utmParams[param].trim();

            // Check length
            if (value.length > 255) {
                throw new Error(
                    "UTM parameter values cannot exceed 255 characters"
                );
            }

            // Check for invalid characters (HTML/script tags)
            if (/<[^>]*>/.test(value)) {
                throw new Error(
                    "UTM parameter values contain invalid characters"
                );
            }

            if (value.length > 0) {
                validatedParams[param] = value;
            }
        }
    });

    return validatedParams;
}

/**
 * Checks if a URL has expired
 * @param {Date | null} expirationDate - Expiration date to check
 * @returns {boolean} True if URL has expired
 */
export function isUrlExpired(expirationDate: Date | null): boolean {
    if (!expirationDate) {
        return false; // No expiration date means never expires
    }

    return new Date() >= expirationDate;
}

/**
 * Validates if a string is a valid UUID
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUuid(uuid: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
