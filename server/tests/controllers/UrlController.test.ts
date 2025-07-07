import request from "supertest";
import express from "express";
import { UrlController } from "../../src/controllers/UrlController";
import { UrlService } from "../../src/services/UrlService";
import { asyncHandler } from "../../src/middleware";
import { errorHandler } from "../../src/middleware/errorHandler";

// Mock the UrlService
jest.mock("../../src/services/UrlService");

const MockedUrlService = UrlService as jest.Mocked<typeof UrlService>;

describe("UrlController", () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Setup routes
        app.post("/api/shorten", asyncHandler(UrlController.createShortUrl));
        app.get("/api/urls", asyncHandler(UrlController.getAllUrls));
        app.get("/api/urls/:id", asyncHandler(UrlController.getUrlById));
        app.delete("/api/urls/:id", asyncHandler(UrlController.deleteUrl));
        app.get(
            "/api/urls/:id/analytics",
            asyncHandler(UrlController.getUrlAnalytics)
        );
        app.get("/r/:shortCode", asyncHandler(UrlController.redirectUrl));

        // Error handler
        app.use(errorHandler);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe("POST /api/shorten", () => {
        it("should create a short URL successfully", async () => {
            const mockUrl = {
                id: "test-id",
                original_url: "https://example.com",
                short_code: "ABC123",
                custom_slug: undefined,
                expiration_date: undefined,
                click_count: 0,
                created_at: new Date(),
                updated_at: new Date(),
                last_accessed: undefined,
                utm_source: undefined,
                utm_medium: undefined,
                utm_campaign: undefined,
                utm_term: undefined,
                utm_content: undefined,
            };

            MockedUrlService.createShortUrl.mockResolvedValue(mockUrl);

            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.originalUrl).toBe("https://example.com");
            expect(response.body.data.shortCode).toBe("ABC123");
            expect(response.body.data.shortUrl).toMatch(/\/ABC123$/);
        });

        it("should create a short URL with custom slug", async () => {
            const mockUrl = {
                id: "test-id",
                original_url: "https://example.com",
                short_code: "ABC123",
                custom_slug: "my-custom-slug",
                expiration_date: undefined,
                click_count: 0,
                created_at: new Date(),
                updated_at: new Date(),
                last_accessed: undefined,
                utm_source: undefined,
                utm_medium: undefined,
                utm_campaign: undefined,
                utm_term: undefined,
                utm_content: undefined,
            };

            MockedUrlService.createShortUrl.mockResolvedValue(mockUrl);

            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
                customSlug: "my-custom-slug",
            });

            expect(response.status).toBe(201);
            expect(response.body.data.customSlug).toBe("my-custom-slug");
            expect(response.body.data.shortUrl).toMatch(/\/my-custom-slug$/);
        });

        it("should create a short URL with expiration date", async () => {
            const expirationDate = new Date("2025-12-31T23:59:59Z");
            const mockUrl = {
                id: "test-id",
                original_url: "https://example.com",
                short_code: "ABC123",
                custom_slug: undefined,
                expiration_date: expirationDate,
                click_count: 0,
                created_at: new Date(),
                updated_at: new Date(),
                last_accessed: undefined,
                utm_source: undefined,
                utm_medium: undefined,
                utm_campaign: undefined,
                utm_term: undefined,
                utm_content: undefined,
            };

            MockedUrlService.createShortUrl.mockResolvedValue(mockUrl);

            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
                expirationDate: expirationDate.toISOString(),
            });

            expect(response.status).toBe(201);
            expect(response.body.data.expirationDate).toBe(
                expirationDate.toISOString()
            );
        });

        it("should create a short URL with UTM parameters", async () => {
            const mockUrl = {
                id: "test-id",
                original_url: "https://example.com",
                short_code: "ABC123",
                custom_slug: undefined,
                expiration_date: undefined,
                click_count: 0,
                created_at: new Date(),
                updated_at: new Date(),
                last_accessed: undefined,
                utm_source: "google",
                utm_medium: "cpc",
                utm_campaign: "summer-sale",
                utm_term: undefined,
                utm_content: undefined,
            };

            MockedUrlService.createShortUrl.mockResolvedValue(mockUrl);

            const response = await request(app)
                .post("/api/shorten")
                .send({
                    originalUrl: "https://example.com",
                    utmParams: {
                        utm_source: "google",
                        utm_medium: "cpc",
                        utm_campaign: "summer-sale",
                    },
                });

            expect(response.status).toBe(201);
            expect(MockedUrlService.createShortUrl).toHaveBeenCalledWith({
                originalUrl: "https://example.com",
                customSlug: undefined,
                expirationDate: undefined,
                utmParams: {
                    utm_source: "google",
                    utm_medium: "cpc",
                    utm_campaign: "summer-sale",
                },
            });
        });

        it("should return 400 when originalUrl is missing", async () => {
            const response = await request(app).post("/api/shorten").send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("originalUrl is required");
        });

        it("should handle service errors gracefully", async () => {
            MockedUrlService.createShortUrl.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Database error");
        });
    });

    describe("GET /api/urls", () => {
        it("should retrieve all URLs with pagination", async () => {
            const testUuid1 = "123e4567-e89b-12d3-a456-426614174004";
            const testUuid2 = "123e4567-e89b-12d3-a456-426614174005";
            const mockResult = {
                urls: [
                    {
                        id: testUuid1,
                        original_url: "https://example.com",
                        short_code: "ABC123",
                        custom_slug: undefined,
                        expiration_date: undefined,
                        click_count: 5,
                        created_at: new Date(),
                        updated_at: new Date(),
                        last_accessed: new Date(),
                    },
                    {
                        id: testUuid2,
                        original_url: "https://google.com",
                        short_code: "DEF456",
                        custom_slug: "google-link",
                        expiration_date: undefined,
                        click_count: 10,
                        created_at: new Date(),
                        updated_at: new Date(),
                        last_accessed: new Date(),
                    },
                ],
                total: 2,
                page: 1,
                totalPages: 1,
            };

            MockedUrlService.getAllUrls.mockResolvedValue(mockResult);

            const response = await request(app).get("/api/urls");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.urls).toHaveLength(2);
            expect(response.body.data.pagination.total).toBe(2);
        });

        it("should handle pagination parameters", async () => {
            const mockResult = {
                urls: [],
                total: 0,
                page: 2,
                totalPages: 0,
            };

            MockedUrlService.getAllUrls.mockResolvedValue(mockResult);

            const response = await request(app).get("/api/urls?page=2&limit=5");

            expect(response.status).toBe(200);
            expect(MockedUrlService.getAllUrls).toHaveBeenCalledWith(2, 5);
        });

        it("should handle service errors", async () => {
            MockedUrlService.getAllUrls.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app).get("/api/urls");

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Failed to retrieve URLs");
        });
    });

    describe("GET /api/urls/:id", () => {
        it("should retrieve a specific URL with analytics", async () => {
            const testUuid = "123e4567-e89b-12d3-a456-426614174000";
            const mockResult = {
                url: {
                    id: testUuid,
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    custom_slug: undefined,
                    expiration_date: undefined,
                    click_count: 5,
                    created_at: new Date(),
                    updated_at: new Date(),
                    last_accessed: new Date(),
                    utm_source: undefined,
                    utm_medium: undefined,
                    utm_campaign: undefined,
                    utm_term: undefined,
                    utm_content: undefined,
                },
                analytics: [
                    {
                        id: "analytics-1",
                        ip_address: "192.168.1.1",
                        user_agent: "Mozilla/5.0",
                        clicked_at: new Date(),
                    },
                ],
                summary: {
                    totalClicks: 5,
                    uniqueClicks: 3,
                    clicksToday: 2,
                    clicksThisWeek: 4,
                    clicksThisMonth: 5,
                    clicksByDay: [],
                },
            };

            MockedUrlService.getUrlAnalytics.mockResolvedValue(mockResult);

            const response = await request(app).get(`/api/urls/${testUuid}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.url.id).toBe(testUuid);
            expect(response.body.data.analytics.summary.totalClicks).toBe(5);
        });

        it("should return 404 when ID is invalid", async () => {
            const response = await request(app).get("/api/urls/invalid-id");

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });

        it("should return 404 when URL not found", async () => {
            const nonExistentUuid = "123e4567-e89b-12d3-a456-426614174999";
            MockedUrlService.getUrlAnalytics.mockRejectedValue(
                new Error("URL not found")
            );

            const response = await request(app).get(
                `/api/urls/${nonExistentUuid}`
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });
    });

    describe("DELETE /api/urls/:id", () => {
        it("should delete a URL successfully", async () => {
            const testUuid = "123e4567-e89b-12d3-a456-426614174001";
            MockedUrlService.deleteUrl.mockResolvedValue(true);

            const response = await request(app).delete(`/api/urls/${testUuid}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("URL deleted successfully");
        });

        it("should return 404 when URL not found", async () => {
            const nonExistentUuid = "123e4567-e89b-12d3-a456-426614174998";
            MockedUrlService.deleteUrl.mockResolvedValue(false);

            const response = await request(app).delete(
                `/api/urls/${nonExistentUuid}`
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });

        it("should handle service errors", async () => {
            const testUuid = "123e4567-e89b-12d3-a456-426614174002";
            MockedUrlService.deleteUrl.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app).delete(`/api/urls/${testUuid}`);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Failed to delete URL");
        });
    });

    describe("GET /api/urls/:id/analytics", () => {
        it("should retrieve URL analytics", async () => {
            const testUuid = "123e4567-e89b-12d3-a456-426614174003";
            const mockResult = {
                url: {
                    id: testUuid,
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    custom_slug: undefined,
                    expiration_date: undefined,
                    click_count: 5,
                    created_at: new Date(),
                    updated_at: new Date(),
                    last_accessed: new Date(),
                    utm_source: undefined,
                    utm_medium: undefined,
                    utm_campaign: undefined,
                    utm_term: undefined,
                    utm_content: undefined,
                },
                analytics: [
                    {
                        id: "analytics-1",
                        ip_address: "192.168.1.1",
                        user_agent: "Mozilla/5.0",
                        clicked_at: new Date(),
                    },
                ],
                summary: {
                    totalClicks: 5,
                    uniqueClicks: 3,
                    clicksByDay: [],
                },
            };

            MockedUrlService.getUrlAnalytics.mockResolvedValue(mockResult);

            const response = await request(app).get(
                `/api/urls/${testUuid}/analytics`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.urlId).toBe(testUuid);
            expect(response.body.data.analytics.summary.totalClicks).toBe(5);
        });

        it("should return 404 when URL not found", async () => {
            const nonExistentUuid = "123e4567-e89b-12d3-a456-426614174997";
            MockedUrlService.getUrlAnalytics.mockRejectedValue(
                new Error("URL not found")
            );

            const response = await request(app).get(
                `/api/urls/${nonExistentUuid}/analytics`
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });
    });

    describe("GET /r/:shortCode", () => {
        it("should redirect to original URL", async () => {
            const mockResult = {
                redirectUrl:
                    "https://example.com?utm_source=google&utm_medium=cpc",
                expired: false,
            };

            MockedUrlService.handleRedirect.mockResolvedValue(mockResult);

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(301);
            expect(response.header.location).toBe(
                "https://example.com?utm_source=google&utm_medium=cpc"
            );
        });

        it("should return 410 when URL is expired", async () => {
            const mockResult = {
                redirectUrl: "https://example.com",
                expired: true,
            };

            MockedUrlService.handleRedirect.mockResolvedValue(mockResult);

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(410);
            expect(response.body.error).toBe("This shortened URL has expired");
        });

        it("should return 404 when short code not found", async () => {
            MockedUrlService.handleRedirect.mockRejectedValue(
                new Error("URL not found")
            );

            const response = await request(app).get("/r/NOTFOUND");

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Shortened URL not found");
        });

        it("should handle service errors", async () => {
            MockedUrlService.handleRedirect.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Failed to redirect");
        });
    });
});
