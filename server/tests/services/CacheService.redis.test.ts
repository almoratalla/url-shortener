/**
 * Simple test to verify Upstash Redis integration with fallback
 */

import { CacheService } from "../../src/services/CacheService";

describe("Redis Cache Integration", () => {
    let cache: CacheService<string>;

    beforeEach(async () => {
        cache = new CacheService<string>(10, 5); // 10 items, 5 minute TTL
        // Wait for Redis initialization
        await new Promise((resolve) => setTimeout(resolve, 200));
    });

    afterEach(async () => {
        await cache.clear();
    });

    it("should work with Redis or fallback to in-memory", async () => {
        // Basic functionality test
        await cache.set("test-key", "test-value");
        const value = await cache.get("test-key");
        expect(value).toBe("test-value");

        // Check stats
        const stats = cache.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.totalRequests).toBe(1);
        expect(stats.hitRate).toBe(100);

        // Test has method
        expect(await cache.has("test-key")).toBe(true);
        expect(await cache.has("nonexistent")).toBe(false);

        // Test delete
        expect(await cache.delete("test-key")).toBe(true);
        expect(await cache.get("test-key")).toBeNull();

        console.log("✅ Cache is working correctly");
        console.log("📊 Stats:", {
            redisConnected: stats.redisConnected,
            fallbackActive: stats.fallbackActive,
            hitRate: stats.hitRate,
        });
    });

    it("should handle cache warmup", async () => {
        const data = [
            { key: "url1", value: "https://example.com" },
            { key: "url2", value: "https://google.com" },
            { key: "url3", value: "https://github.com" },
        ];

        await cache.warmUp(data);

        expect(await cache.get("url1")).toBe("https://example.com");
        expect(await cache.get("url2")).toBe("https://google.com");
        expect(await cache.get("url3")).toBe("https://github.com");

        const stats = cache.getStats();
        expect(stats.hits).toBe(3);
        console.log("✅ Cache warmup working correctly");
    });
});
