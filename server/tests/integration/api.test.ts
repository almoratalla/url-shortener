import request from "supertest";
import express from "express";
import { db } from "../../src/db/knex";
import routes from "../../src/routes";
import {
    errorHandler,
    notFoundHandler,
} from "../../src/middleware/errorHandler";
import { requestLogger } from "../../src/middleware";

describe("API Integration Tests", () => {
    let app: express.Application;

    beforeAll(async () => {
        // Setup test app
        app = express();
        app.use(express.json());
        app.use(requestLogger);
        app.use(routes);
        app.use(notFoundHandler);
        app.use(errorHandler);

        // Run migrations for test database
        await db.migrate.latest();
    });

    afterAll(async () => {
        // Clean up test database
        await db.migrate.rollback();
        await db.destroy();
    });

    beforeEach(async () => {
        // Clean up data before each test
        await db("url_analytics").del();
        await db("urls").del();
    });

    describe("POST /api/shorten", () => {
        it("should create a shortened URL", async () => {
            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.originalUrl).toBe("https://example.com");
            expect(response.body.data.shortCode).toMatch(/^[A-Za-z0-9]{8}$/);
            expect(response.body.data.shortUrl).toMatch(/\/[A-Za-z0-9]{8}$/);

            // Verify database entry
            const urlRecord = await db("urls")
                .where("id", response.body.data.id)
                .first();
            expect(urlRecord).toBeDefined();
            expect(urlRecord.original_url).toBe("https://example.com");
        });

        it("should create a shortened URL with custom slug", async () => {
            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
                customSlug: "my-custom-link",
            });

            expect(response.status).toBe(201);
            expect(response.body.data.customSlug).toBe("my-custom-link");
            expect(response.body.data.shortUrl).toMatch(/\/my-custom-link$/);

            // Verify database entry
            const urlRecord = await db("urls")
                .where("custom_slug", "my-custom-link")
                .first();
            expect(urlRecord).toBeDefined();
        });

        it("should reject duplicate custom slugs", async () => {
            // First request
            await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
                customSlug: "duplicate-slug",
            });

            // Second request with same slug
            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://google.com",
                customSlug: "duplicate-slug",
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Custom slug already exists");
        });

        it("should create a shortened URL with expiration date", async () => {
            const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

            const response = await request(app).post("/api/shorten").send({
                originalUrl: "https://example.com",
                expirationDate: expirationDate.toISOString(),
            });

            expect(response.status).toBe(201);
            expect(response.body.data.expirationDate).toBe(
                expirationDate.toISOString()
            );
        });

        it("should create a shortened URL with UTM parameters", async () => {
            const response = await request(app)
                .post("/api/shorten")
                .send({
                    originalUrl: "https://example.com",
                    utmParams: {
                        utm_source: "google",
                        utm_medium: "cpc",
                        utm_campaign: "test-campaign",
                    },
                });

            expect(response.status).toBe(201);

            // Verify UTM parameters in database
            const urlRecord = await db("urls")
                .where("id", response.body.data.id)
                .first();
            expect(urlRecord.utm_source).toBe("google");
            expect(urlRecord.utm_medium).toBe("cpc");
            expect(urlRecord.utm_campaign).toBe("test-campaign");
        });

        it("should reject invalid URLs", async () => {
            const response = await request(app).post("/api/shorten").send({
                originalUrl: "invalid-url",
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid URL");
        });

        it("should reject missing originalUrl", async () => {
            const response = await request(app).post("/api/shorten").send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("originalUrl is required");
        });
    });

    describe("GET /api/urls", () => {
        it("should retrieve all URLs with pagination", async () => {
            // Create test URLs
            await db("urls").insert([
                {
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    click_count: 5,
                },
                {
                    original_url: "https://google.com",
                    short_code: "DEF456",
                    click_count: 10,
                },
            ]);

            const response = await request(app).get("/api/urls");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.urls).toHaveLength(2);
            expect(response.body.data.pagination.total).toBe(2);
        });

        it("should handle pagination parameters", async () => {
            // Create test URLs
            const urls = Array.from({ length: 15 }, (_, i) => ({
                original_url: `https://example${i + 1}.com`,
                short_code: `CODE${i + 1}`,
                click_count: i,
            }));

            await db("urls").insert(urls);

            const response = await request(app).get("/api/urls?page=2&limit=5");

            expect(response.status).toBe(200);
            expect(response.body.data.urls).toHaveLength(5);
            expect(response.body.data.pagination.page).toBe(2);
            expect(response.body.data.pagination.limit).toBe(5);
            expect(response.body.data.pagination.total).toBe(15);
        });

        it("should return empty array when no URLs exist", async () => {
            const response = await request(app).get("/api/urls");

            expect(response.status).toBe(200);
            expect(response.body.data.urls).toHaveLength(0);
            expect(response.body.data.pagination.total).toBe(0);
        });
    });

    describe("GET /api/urls/:id", () => {
        it("should retrieve a specific URL with analytics", async () => {
            // Create test URL
            const [urlRecord] = await db("urls")
                .insert({
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    click_count: 5,
                })
                .returning("*");

            // Create test analytics
            await db("url_analytics").insert([
                {
                    url_id: urlRecord.id,
                    ip_address: "192.168.1.1",
                    user_agent: "Mozilla/5.0",
                    clicked_at: new Date(),
                },
                {
                    url_id: urlRecord.id,
                    ip_address: "192.168.1.2",
                    user_agent: "Chrome/91.0",
                    clicked_at: new Date(),
                },
            ]);

            const response = await request(app).get(
                `/api/urls/${urlRecord.id}`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.url.id).toBe(urlRecord.id);
            expect(response.body.data.analytics.summary.totalClicks).toBe(5);
        });

        it("should return 404 for non-existent URL", async () => {
            const response = await request(app).get(
                "/api/urls/non-existent-id"
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });
    });

    describe("DELETE /api/urls/:id", () => {
        it("should delete a URL successfully", async () => {
            // Create test URL
            const [urlRecord] = await db("urls")
                .insert({
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    click_count: 0,
                })
                .returning("*");

            const response = await request(app).delete(
                `/api/urls/${urlRecord.id}`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("URL deleted successfully");

            // Verify URL is deleted
            const deletedRecord = await db("urls")
                .where("id", urlRecord.id)
                .first();
            expect(deletedRecord).toBeUndefined();
        });

        it("should return 404 for non-existent URL", async () => {
            const response = await request(app).delete(
                "/api/urls/non-existent-id"
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });
    });

    describe("GET /r/:shortCode", () => {
        it("should redirect to original URL", async () => {
            // Create test URL
            const [urlRecord] = await db("urls")
                .insert({
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    click_count: 0,
                })
                .returning("*");

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(301);
            expect(response.header.location).toBe("https://example.com");

            // Verify click count is incremented
            const updatedRecord = await db("urls")
                .where("id", urlRecord.id)
                .first();
            expect(updatedRecord.click_count).toBe(1);

            // Verify analytics record is created
            const analyticsRecord = await db("url_analytics")
                .where("url_id", urlRecord.id)
                .first();
            expect(analyticsRecord).toBeDefined();
        });

        it("should redirect with UTM parameters", async () => {
            // Create test URL with UTM parameters
            await db("urls").insert({
                original_url: "https://example.com",
                short_code: "ABC123",
                utm_source: "google",
                utm_medium: "cpc",
                utm_campaign: "test",
                click_count: 0,
            });

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(301);
            expect(response.header.location).toBe(
                "https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=test"
            );
        });

        it("should return 410 for expired URLs", async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

            await db("urls").insert({
                original_url: "https://example.com",
                short_code: "ABC123",
                expiration_date: pastDate,
                click_count: 0,
            });

            const response = await request(app).get("/r/ABC123");

            expect(response.status).toBe(410);
            expect(response.body.error).toBe("This shortened URL has expired");
        });

        it("should return 404 for non-existent short code", async () => {
            const response = await request(app).get("/r/NOTFOUND");

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Shortened URL not found");
        });

        it("should handle custom slug redirect", async () => {
            await db("urls").insert({
                original_url: "https://example.com",
                short_code: "ABC123",
                custom_slug: "my-custom-link",
                click_count: 0,
            });

            const response = await request(app).get("/r/my-custom-link");

            expect(response.status).toBe(301);
            expect(response.header.location).toBe("https://example.com");
        });
    });

    describe("GET /api/urls/:id/analytics", () => {
        it("should retrieve detailed analytics for a URL", async () => {
            // Create test URL
            const [urlRecord] = await db("urls")
                .insert({
                    original_url: "https://example.com",
                    short_code: "ABC123",
                    click_count: 5,
                })
                .returning("*");

            // Create test analytics
            await db("url_analytics").insert([
                {
                    url_id: urlRecord.id,
                    ip_address: "192.168.1.1",
                    user_agent: "Mozilla/5.0",
                    clicked_at: new Date(),
                },
                {
                    url_id: urlRecord.id,
                    ip_address: "192.168.1.2",
                    user_agent: "Chrome/91.0",
                    clicked_at: new Date(),
                },
            ]);

            const response = await request(app).get(
                `/api/urls/${urlRecord.id}/analytics`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.urlId).toBe(urlRecord.id);
            expect(response.body.data.analytics.summary.totalClicks).toBe(5);
            expect(response.body.data.analytics.recentClicks).toBeDefined();
        });

        it("should return 404 for non-existent URL", async () => {
            const response = await request(app).get(
                "/api/urls/non-existent-id/analytics"
            );

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("URL not found");
        });
    });
});
