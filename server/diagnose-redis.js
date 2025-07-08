// Diagnostic script to check Redis connection status
console.log("Diagnostic: Redis Connection Status");

const { Redis } = require("@upstash/redis");
require('dotenv').config();

async function diagnoseRedis() {
    console.log("🔍 Environment Variables:");
    console.log("- UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL ? "✅ Set" : "❌ Missing");
    console.log("- UPSTASH_REDIS_REST_TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ Set" : "❌ Missing");

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.log("❌ Cannot proceed without Redis credentials");
        return;
    }

    console.log("\n🔌 Testing Redis Connection:");

    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        console.log("- Creating Redis client: ✅");

        const startTime = Date.now();
        const pingResult = await redis.ping();
        const pingTime = Date.now() - startTime;

        console.log(`- Ping test: ✅ ${pingResult} (${pingTime}ms)`);

        // Test a simple write
        const writeStart = Date.now();
        await redis.set("diagnostic_test", "success");
        const writeTime = Date.now() - writeStart;
        console.log(`- Write test: ✅ (${writeTime}ms)`);

        // Test a read
        const readStart = Date.now();
        const value = await redis.get("diagnostic_test");
        const readTime = Date.now() - readStart;
        console.log(`- Read test: ✅ ${value} (${readTime}ms)`);

        // Test setex (what the cache service uses)
        const setexStart = Date.now();
        await redis.setex("diagnostic_ttl", 60, JSON.stringify({ test: "data", timestamp: Date.now() }));
        const setexTime = Date.now() - setexStart;
        console.log(`- Setex test: ✅ (${setexTime}ms)`);

        // Verify setex
        const ttlValue = await redis.get("diagnostic_ttl");
        console.log(`- TTL value: ✅ ${ttlValue ? "Found" : "Not found"}`);

        // Cleanup
        await redis.del("diagnostic_test");
        await redis.del("diagnostic_ttl");
        console.log("- Cleanup: ✅");

        console.log("\n🎉 Redis is working perfectly!");
        console.log("💡 Issue might be in the CacheService initialization timing");

    } catch (error) {
        console.error("❌ Redis connection failed:", error);
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);

        if (error.response) {
            console.error("HTTP status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
    }
}

diagnoseRedis();
