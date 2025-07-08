/**
 * Test Redis write functionality using TypeScript
 */

import {
    urlCache,
    redirectCache,
    analyticsCache,
} from "./src/services/CacheService";
import { Redis } from "@upstash/redis";

async function testRedisWrite() {
    console.log("🔍 Testing Upstash Redis write functionality...\n");

    // Test direct Redis connection
    console.log("🔌 Testing direct Redis connection...");
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        console.error("❌ Redis credentials not found");
        return;
    }

    const redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });

    try {
        // Test ping
        const pingResult = await redis.ping();
        console.log(`✅ Ping result: ${pingResult}\n`);

        // Test direct write
        console.log("✏️ Testing direct Redis write...");
        const testKey = `direct_test_${Date.now()}`;
        await redis.setex(testKey, 60, "test_value");
        const readBack = await redis.get(testKey);
        console.log(`✅ Direct write/read successful: ${readBack}\n`);

        // Clean up
        await redis.del(testKey);
    } catch (error) {
        console.error("❌ Direct Redis test failed:", error);
    }

    // Test CacheService
    console.log("🧪 Testing CacheService...");

    // Test URL cache
    console.log("📝 Testing URL cache write...");
    const testUrl = {
        id: "test-123",
        original_url: "https://example.com",
        short_code: "test123",
        click_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };

    try {
        await urlCache.set("test123", testUrl);
        console.log("✅ URL cache write completed");

        const cachedResult = await urlCache.get("test123");
        console.log(
            "✅ URL cache read completed:",
            cachedResult ? "Found" : "Not found"
        );

        // Get initial stats
        const stats = urlCache.getStats();
        console.log("\n📊 URL Cache Stats:");
        console.log(`Redis Connected: ${stats.redisConnected ? "✅" : "❌"}`);
        console.log(`Fallback Active: ${stats.fallbackActive ? "⚠️" : "✅"}`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Hits: ${stats.hits}`);
        console.log(`Misses: ${stats.misses}`);
        console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`);
    } catch (error) {
        console.error("❌ URL cache test failed:", error);
    }

    // Test redirect cache
    console.log("\n🔀 Testing redirect cache...");
    try {
        await redirectCache.set("test123", "https://example.com/redirect");
        console.log("✅ Redirect cache write completed");

        const redirectResult = await redirectCache.get("test123");
        console.log(
            "✅ Redirect cache read completed:",
            redirectResult ? "Found" : "Not found"
        );

        const redirectStats = redirectCache.getStats();
        console.log("\n📊 Redirect Cache Stats:");
        console.log(
            `Redis Connected: ${redirectStats.redisConnected ? "✅" : "❌"}`
        );
        console.log(
            `Fallback Active: ${redirectStats.fallbackActive ? "⚠️" : "✅"}`
        );
    } catch (error) {
        console.error("❌ Redirect cache test failed:", error);
    }

    // Test analytics cache
    console.log("\n📈 Testing analytics cache...");
    try {
        const testAnalytics = {
            url: testUrl,
            analytics: [],
            summary: { totalClicks: 0, uniqueClicks: 0, clicksByDay: [] },
        };

        await analyticsCache.set("test123", testAnalytics);
        console.log("✅ Analytics cache write completed");

        const analyticsResult = await analyticsCache.get("test123");
        console.log(
            "✅ Analytics cache read completed:",
            analyticsResult ? "Found" : "Not found"
        );

        const analyticsStats = analyticsCache.getStats();
        console.log("\n📊 Analytics Cache Stats:");
        console.log(
            `Redis Connected: ${analyticsStats.redisConnected ? "✅" : "❌"}`
        );
        console.log(
            `Fallback Active: ${analyticsStats.fallbackActive ? "⚠️" : "✅"}`
        );
    } catch (error) {
        console.error("❌ Analytics cache test failed:", error);
    }

    // Clean up
    console.log("\n🧹 Cleaning up...");
    try {
        await urlCache.delete("test123");
        await redirectCache.delete("test123");
        await analyticsCache.delete("test123");
        console.log("✅ Cleanup completed");
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
    }

    console.log("\n🎉 Redis write tests completed!");
}

testRedisWrite().catch(console.error);
