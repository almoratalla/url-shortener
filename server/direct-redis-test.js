// Simple test to verify Redis writes
console.log("Testing Redis writes after fix...");

const { Redis } = require("@upstash/redis");
require('dotenv').config();

async function testWrite() {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
        console.log("🔍 Testing direct Redis write...");

        // Test 1: Simple set/get
        await redis.set("test_simple", "hello_world");
        const result1 = await redis.get("test_simple");
        console.log("✅ Simple set/get:", result1);

        // Test 2: Set with TTL
        await redis.setex("test_ttl", 300, "expires_in_5min");
        const result2 = await redis.get("test_ttl");
        console.log("✅ TTL set/get:", result2);

        // Test 3: JSON object
        const testObj = { name: "test", timestamp: Date.now() };
        await redis.setex("test_json", 300, JSON.stringify(testObj));
        const result3 = await redis.get("test_json");
        console.log("✅ JSON set/get:", typeof result3, result3);

        // Test 4: Delete
        await redis.del("test_simple");
        await redis.del("test_ttl");
        await redis.del("test_json");
        console.log("✅ Cleanup completed");

        console.log("🎉 All Redis write tests passed!");

    } catch (error) {
        console.error("❌ Redis test failed:", error);
    }
}

testWrite();
