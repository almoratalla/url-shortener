import {
    validateAndNormalizeUrl,
    validateExpirationDate,
    validateUtmParams,
    isUrlExpired,
} from "../../src/utils/validators";

describe("validators", () => {
    describe("validateAndNormalizeUrl", () => {
        it("should validate and normalize valid URLs", () => {
            expect(validateAndNormalizeUrl("https://example.com")).toBe(
                "https://example.com"
            );
            expect(validateAndNormalizeUrl("http://example.com")).toBe(
                "http://example.com"
            );
            expect(
                validateAndNormalizeUrl("https://sub.example.com/path")
            ).toBe("https://sub.example.com/path");
            expect(validateAndNormalizeUrl("https://example.com:8080")).toBe(
                "https://example.com:8080"
            );
        });

        it("should add protocol to URLs without it", () => {
            expect(validateAndNormalizeUrl("example.com")).toBe(
                "https://example.com"
            );
            expect(validateAndNormalizeUrl("www.example.com")).toBe(
                "https://www.example.com"
            );
            expect(validateAndNormalizeUrl("sub.example.com/path")).toBe(
                "https://sub.example.com/path"
            );
        });

        it("should handle URLs with query parameters", () => {
            expect(
                validateAndNormalizeUrl("https://example.com?param=value")
            ).toBe("https://example.com?param=value");
            expect(validateAndNormalizeUrl("example.com?param=value")).toBe(
                "https://example.com?param=value"
            );
        });

        it("should handle URLs with fragments", () => {
            expect(validateAndNormalizeUrl("https://example.com#section")).toBe(
                "https://example.com#section"
            );
            expect(validateAndNormalizeUrl("example.com#section")).toBe(
                "https://example.com#section"
            );
        });

        it("should throw error for invalid URLs", () => {
            expect(() => validateAndNormalizeUrl("")).toThrow(
                "URL is required"
            );
            expect(() => validateAndNormalizeUrl("invalid-url")).toThrow(
                "Invalid URL format"
            );
            expect(() => validateAndNormalizeUrl("ftp://example.com")).toThrow(
                "Invalid URL format"
            );
            expect(() =>
                validateAndNormalizeUrl("javascript:alert(1)")
            ).toThrow("Invalid URL format");
        });

        it("should throw error for URLs that are too long", () => {
            const longUrl = "https://example.com/" + "a".repeat(2000);
            expect(() => validateAndNormalizeUrl(longUrl)).toThrow(
                "URL is too long (max 2000 characters)"
            );
        });

        it("should throw error for localhost URLs in production", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";

            expect(() =>
                validateAndNormalizeUrl("http://localhost:3000")
            ).toThrow("Localhost URLs are not allowed in production");
            expect(() =>
                validateAndNormalizeUrl("http://127.0.0.1:3000")
            ).toThrow("Localhost URLs are not allowed in production");

            process.env.NODE_ENV = originalEnv;
        });

        it("should allow localhost URLs in development", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";

            expect(validateAndNormalizeUrl("http://localhost:3000")).toBe(
                "http://localhost:3000"
            );
            expect(validateAndNormalizeUrl("http://127.0.0.1:3000")).toBe(
                "http://127.0.0.1:3000"
            );

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("validateExpirationDate", () => {
        it("should validate valid future dates", () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
            const result = validateExpirationDate(futureDate.toISOString());
            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBe(futureDate.getTime());
        });

        it("should validate date strings", () => {
            const result = validateExpirationDate("2025-12-31T23:59:59Z");
            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2026);
        });

        it("should throw error for past dates", () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            expect(() =>
                validateExpirationDate(pastDate.toISOString())
            ).toThrow("Expiration date must be in the future");
        });

        it("should throw error for invalid date strings", () => {
            expect(() => validateExpirationDate("invalid-date")).toThrow(
                "Invalid expiration date format"
            );
            expect(() => validateExpirationDate("2025-13-32")).toThrow(
                "Invalid expiration date format"
            );
        });

        it("should throw error for dates too far in the future", () => {
            const farFuture = new Date(
                Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
            ); // 10 years from now
            expect(() =>
                validateExpirationDate(farFuture.toISOString())
            ).toThrow("Expiration date cannot be more than 1 year from now");
        });
    });

    describe("validateUtmParams", () => {
        it("should validate valid UTM parameters", () => {
            const utmParams = {
                utm_source: "google",
                utm_medium: "cpc",
                utm_campaign: "summer-sale",
                utm_term: "keyword",
                utm_content: "ad1",
            };

            const result = validateUtmParams(utmParams);
            expect(result).toEqual(utmParams);
        });

        it("should validate partial UTM parameters", () => {
            const utmParams = {
                utm_source: "google",
                utm_medium: "cpc",
            };

            const result = validateUtmParams(utmParams);
            expect(result).toEqual(utmParams);
        });

        it("should filter out empty string values", () => {
            const utmParams = {
                utm_source: "google",
                utm_medium: "",
                utm_campaign: "summer-sale",
                utm_term: null,
                utm_content: undefined,
            };

            const result = validateUtmParams(utmParams);
            expect(result).toEqual({
                utm_source: "google",
                utm_campaign: "summer-sale",
            });
        });

        it("should throw error for invalid UTM parameter names", () => {
            const utmParams = {
                utm_source: "google",
                invalid_param: "value",
            };

            expect(() => validateUtmParams(utmParams)).toThrow(
                "Invalid UTM parameter: invalid_param"
            );
        });

        it("should throw error for UTM values that are too long", () => {
            const utmParams = {
                utm_source: "a".repeat(256), // Too long
            };

            expect(() => validateUtmParams(utmParams)).toThrow(
                "UTM parameter values cannot exceed 255 characters"
            );
        });

        it("should throw error for UTM values with invalid characters", () => {
            const utmParams = {
                utm_source: "google<script>alert(1)</script>",
            };

            expect(() => validateUtmParams(utmParams)).toThrow(
                "UTM parameter values contain invalid characters"
            );
        });

        it("should handle empty object", () => {
            const result = validateUtmParams({});
            expect(result).toEqual({});
        });
    });

    describe("isUrlExpired", () => {
        it("should return false for URLs without expiration date", () => {
            expect(isUrlExpired(null)).toBe(false);
        });

        it("should return false for URLs with future expiration date", () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
            expect(isUrlExpired(futureDate)).toBe(false);
        });

        it("should return true for URLs with past expiration date", () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            expect(isUrlExpired(pastDate)).toBe(true);
        });

        it("should return true for URLs with current time as expiration (edge case)", () => {
            const now = new Date();
            expect(isUrlExpired(now)).toBe(true);
        });
    });
});
