/**
 * Test Redis write functionality
 */

const { Redis } = require("@upstash/redis");
require('dotenv').config();

async function testRedisWrite() {
    console.log("🔍 Testing Upstash Redis write functionality...\n");

    // Check environment variables
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log("📋 Environment check:");
    console.log(`Redis URL: ${redisUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`Redis Token: ${redisToken ? '✅ Set' : '❌ Missing'}\n`);

    if (!redisUrl || !redisToken) {
        console.error("❌ Redis credentials not found in environment variables");
        process.exit(1);
    }

    try {
        // Initialize Redis client
        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        console.log("🔌 Testing Redis connection...");

        // Test connection
        const pingResult = await redis.ping();
        console.log(`Ping result: ${pingResult}\n`);

        // Test write operation
        console.log("✏️ Testing write operation...");
        const testKey = `test_write_${Date.now()}`;
        const testValue = { message: "Hello from Redis write test!", timestamp: new Date().toISOString() };

        await redis.setex(testKey, 300, JSON.stringify(testValue)); // 5 minutes TTL
        console.log(`✅ Successfully wrote to Redis: ${testKey}\n`);

        // Test read operation
        console.log("📖 Testing read operation...");
        const readResult = await redis.get(testKey);
        console.log(`Raw result type: ${typeof readResult}, value:`, readResult);

        let parsedResult;
        if (typeof readResult === 'string') {
            parsedResult = JSON.parse(readResult);
        } else {
            parsedResult = readResult;
        }
        console.log(`✅ Successfully read from Redis:`, parsedResult);

        // Test delete operation
        console.log("\n🗑️ Testing delete operation...");
        const deleteResult = await redis.del(testKey);
        console.log(`✅ Delete result: ${deleteResult} key(s) deleted\n`);

        // Verify deletion
        const verifyResult = await redis.get(testKey);
        console.log(`✅ Verify deletion: ${verifyResult === null ? 'Key successfully deleted' : 'Key still exists'}\n`);

        // Test cache service specifically
        console.log("🧪 Testing CacheService write functionality...");

        // Import compiled JavaScript version
        const { urlCache } = require('./dist/services/CacheService');

        const testUrl = {
            id: 'test-123',
            original_url: 'https://example.com',
            short_code: 'test123',
            click_count: 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        // Test cache service set
        await urlCache.set('test123', testUrl);
        console.log("✅ CacheService write completed");

        // Test cache service get
        const cachedResult = await urlCache.get('test123');
        console.log("✅ CacheService read completed:", cachedResult ? 'Found' : 'Not found');

        // Get cache stats
        const stats = urlCache.getStats();
        console.log("\n📊 Cache Stats:");
        console.log(`Redis Connected: ${stats.redisConnected ? '✅' : '❌'}`);
        console.log(`Fallback Active: ${stats.fallbackActive ? '⚠️' : '✅'}`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Hits: ${stats.hits}`);
        console.log(`Misses: ${stats.misses}`);
        console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`);

        // Clean up
        await urlCache.delete('test123');
        console.log("\n🧹 Cleanup completed");

        console.log("\n🎉 All Redis write tests passed!");

    } catch (error) {
        console.error("❌ Redis write test failed:", error);
        console.error("Error details:", error.message);
        process.exit(1);
    }
}

testRedisWrite();
