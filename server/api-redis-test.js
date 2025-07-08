// Test the URL shortener API to verify Redis writes
console.log("Testing URL shortener API Redis writes...");

const { Redis } = require("@upstash/redis");
require('dotenv').config();

async function testApiRedisWrites() {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
        console.log("🔍 Testing API-triggered Redis writes...");

        // Test 1: Create a URL via API
        console.log("📝 Creating shortened URL via API...");
        const response = await fetch('http://localhost:8000/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalUrl: 'https://example.com/test-redis-write',
                customSlug: 'test-redis-' + Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ URL created:", data.data.shortCode);

        // Test 2: Check if URL is cached in Redis
        console.log("🔍 Checking if URL is cached in Redis...");

        // Check both possible cache keys
        const shortCodeKey = data.data.shortCode;
        const customSlugKey = data.data.customSlug;

        const cachedByShortCode = await redis.get(shortCodeKey);
        const cachedByCustomSlug = customSlugKey ? await redis.get(customSlugKey) : null;

        console.log("Cache by short code:", cachedByShortCode ? "✅ Found" : "❌ Not found");
        console.log("Cache by custom slug:", cachedByCustomSlug ? "✅ Found" : "❌ Not found");

        // Test 3: Test redirect and check redirect cache
        console.log("🔀 Testing redirect...");
        const redirectResponse = await fetch(`http://localhost:8000/api/redirect/${shortCodeKey}`);

        if (redirectResponse.ok) {
            const redirectData = await redirectResponse.json();
            console.log("✅ Redirect successful:", redirectData.data.redirectUrl);

            // Check redirect cache
            const redirectCached = await redis.get(shortCodeKey);
            console.log("Redirect cache:", redirectCached ? "✅ Found" : "❌ Not found");
        } else {
            console.log("❌ Redirect failed:", redirectResponse.status);
        }

        // Test 4: List all keys in Redis to see what's actually stored
        console.log("🔍 Checking Redis keys...");
        const keys = await redis.keys('*');
        console.log("Redis keys found:", keys.length);

        // Show a few example keys
        if (keys.length > 0) {
            console.log("Sample keys:", keys.slice(0, 5));

            // Check if our keys are there
            const ourKeys = keys.filter(key => key.includes(shortCodeKey) || (customSlugKey && key.includes(customSlugKey)));
            console.log("Our keys in Redis:", ourKeys);
        }

        console.log("🎉 API Redis write test completed!");

    } catch (error) {
        console.error("❌ API Redis test failed:", error);
    }
}

testApiRedisWrites();
