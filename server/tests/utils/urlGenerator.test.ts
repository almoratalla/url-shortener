import { generateShortCode, buildUtmUrl } from "../../src/utils/urlGenerator";

describe("urlGenerator", () => {
    describe("generateShortCode", () => {
        it("should generate an 8-character code", () => {
            const code = generateShortCode();
            expect(code).toHaveLength(8);
        });

        it("should generate alphanumeric codes", () => {
            const code = generateShortCode();
            expect(code).toMatch(/^[A-Za-z0-9]+$/);
        });

        it("should generate different codes on multiple calls", () => {
            const code1 = generateShortCode();
            const code2 = generateShortCode();
            expect(code1).not.toBe(code2);
        });
    });

    describe("buildUtmUrl", () => {
        it("should build URL with UTM parameters", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "google",
                utm_medium: "cpc",
                utm_campaign: "summer-sale",
                utm_term: "keyword",
                utm_content: "ad1",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer-sale&utm_term=keyword&utm_content=ad1"
            );
        });

        it("should build URL with partial UTM parameters", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "google",
                utm_medium: "cpc",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google&utm_medium=cpc"
            );
        });

        it("should handle URLs that already have query parameters", () => {
            const baseUrl = "https://example.com/?existing=param";
            const utmParams = {
                utm_source: "google",
                utm_medium: "cpc",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com/?existing=param&utm_source=google&utm_medium=cpc"
            );
        });

        it("should handle empty UTM values", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "google",
                utm_medium: "",
                utm_campaign: "summer-sale",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google&utm_campaign=summer-sale"
            );
        });

        it("should handle undefined UTM values", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "google",
                utm_medium: undefined,
                utm_campaign: "summer-sale",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google&utm_campaign=summer-sale"
            );
        });

        it("should handle special characters in UTM values", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "google ads",
                utm_medium: "cpc/display",
                utm_campaign: "summer sale 2025",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google+ads&utm_medium=cpc%2Fdisplay&utm_campaign=summer+sale+2025"
            );
        });

        it("should handle empty UTM object", () => {
            const baseUrl = "https://example.com";
            const utmParams = {};

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe("https://example.com/");
        });

        it("should handle UTM values with whitespace", () => {
            const baseUrl = "https://example.com";
            const utmParams = {
                utm_source: "  google  ",
                utm_medium: "cpc",
            };

            const result = buildUtmUrl(baseUrl, utmParams);

            expect(result).toBe(
                "https://example.com?utm_source=google&utm_medium=cpc"
            );
        });
    });
});
