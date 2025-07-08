const { Redis } = require("@upstash/redis");
require('dotenv').config();

console.log("Starting Redis write test...");

async function simpleTest() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log("Redis URL:", redisUrl ? "Present" : "Missing");
    console.log("Redis Token:", redisToken ? "Present" : "Missing");

    if (!redisUrl || !redisToken) {
        console.error("Missing Redis credentials");
        return;
    }

    const redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });

    try {
        console.log("Testing ping...");
        const ping = await redis.ping();
        console.log("Ping result:", ping);

        console.log("Testing set operation...");
        await redis.set("test_key", "test_value");
        console.log("Set operation completed");

        console.log("Testing get operation...");
        const value = await redis.get("test_key");
        console.log("Get result:", value);

        console.log("Testing setex operation...");
        await redis.setex("test_key_ttl", 60, "test_value_with_ttl");
        console.log("Setex operation completed");

        const ttlValue = await redis.get("test_key_ttl");
        console.log("TTL Get result:", ttlValue);

        console.log("Testing delete...");
        await redis.del("test_key");
        await redis.del("test_key_ttl");
        console.log("Delete completed");

        console.log("All tests passed!");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

simpleTest();
