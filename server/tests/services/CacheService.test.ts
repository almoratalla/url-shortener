/**
 * Tests for CacheService
 */

import { CacheService } from "../../src/services/CacheService";

describe("CacheService", () => {
    let cache: CacheService<string>;

    beforeEach(async () => {
        cache = new CacheService<string>(3, 1); // Max size 3, TTL 1 minute
        // Wait a moment for Redis initialization (will fallback to in-memory if no Redis)
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    afterEach(async () => {
        await cache.clear();
    });

    describe("Basic operations", () => {
        it("should set and get values", async () => {
            await cache.set("key1", "value1");
            expect(await cache.get("key1")).toBe("value1");
        });

        it("should return null for non-existent keys", async () => {
            expect(await cache.get("nonexistent")).toBeNull();
        });

        it("should check if cache has key", async () => {
            await cache.set("key1", "value1");
            expect(await cache.has("key1")).toBe(true);
            expect(await cache.has("nonexistent")).toBe(false);
        });

        it("should delete values", async () => {
            await cache.set("key1", "value1");
            expect(await cache.delete("key1")).toBe(true);
            expect(await cache.get("key1")).toBeNull();
            expect(await cache.delete("nonexistent")).toBe(false);
        });

        it("should clear all values", async () => {
            await cache.set("key1", "value1");
            await cache.set("key2", "value2");
            await cache.clear();
            expect(cache.size()).toBe(0);
            expect(await cache.get("key1")).toBeNull();
        });

        it("should track cache size", async () => {
            expect(cache.size()).toBe(0);
            await cache.set("key1", "value1");
            expect(cache.size()).toBe(1);
            await cache.set("key2", "value2");
            expect(cache.size()).toBe(2);
        });
    });

    describe("LRU eviction", () => {
        it("should evict least recently used item when cache is full", async () => {
            // Fill cache to max size with slight delays to ensure different timestamps
            await cache.set("key1", "value1");
            await new Promise((resolve) => setTimeout(resolve, 1));
            await cache.set("key2", "value2");
            await new Promise((resolve) => setTimeout(resolve, 1));
            await cache.set("key3", "value3");
            expect(cache.size()).toBe(3);

            // Access key1 to make it recently used
            await new Promise((resolve) => setTimeout(resolve, 1));
            await cache.get("key1");

            // Add another item, should evict key2 (least recently used)
            await new Promise((resolve) => setTimeout(resolve, 1));
            await cache.set("key4", "value4");
            expect(cache.size()).toBe(3);
            expect(await cache.get("key1")).toBe("value1"); // Still there
            expect(await cache.get("key2")).toBeNull(); // Evicted
            expect(await cache.get("key3")).toBe("value3"); // Still there
            expect(cache.get("key4")).toBe("value4"); // New item
        });

        it("should not evict when updating existing key", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");

            // Update existing key - should not evict
            cache.set("key1", "updated_value1");
            expect(cache.size()).toBe(3);
            expect(cache.get("key1")).toBe("updated_value1");
            expect(cache.get("key2")).toBe("value2");
            expect(cache.get("key3")).toBe("value3");
        });
    });

    describe("Statistics tracking", () => {
        it("should track cache hits and misses", () => {
            cache.set("key1", "value1");

            // Hit
            cache.get("key1");
            let stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(0);
            expect(stats.totalRequests).toBe(1);
            expect(stats.hitRate).toBe(100);

            // Miss
            cache.get("nonexistent");
            stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.totalRequests).toBe(2);
            expect(stats.hitRate).toBe(50);
        });

        it("should track evictions", () => {
            // Fill cache and force eviction
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");
            cache.set("key4", "value4"); // This should cause eviction

            const stats = cache.getStats();
            expect(stats.evictions).toBe(1);
        });

        it("should reset stats when cache is cleared", () => {
            cache.set("key1", "value1");
            cache.get("key1");
            cache.get("nonexistent");

            cache.clear();
            const stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.totalRequests).toBe(0);
            expect(stats.hitRate).toBe(0);
            expect(stats.evictions).toBe(0);
        });
    });

    describe("TTL (Time To Live)", () => {
        it("should expire entries after TTL", (done) => {
            const shortTtlCache = new CacheService<string>(10, 0.01); // 0.01 minutes = 0.6 seconds
            shortTtlCache.set("key1", "value1");

            // Should be available immediately
            expect(shortTtlCache.get("key1")).toBe("value1");

            // Should expire after TTL
            setTimeout(() => {
                expect(shortTtlCache.get("key1")).toBeNull();
                done();
            }, 700); // Wait 700ms (longer than 600ms TTL)
        });

        it("should update access time on get", (done) => {
            const shortTtlCache = new CacheService<string>(10, 0.01); // 0.01 minutes = 0.6 seconds
            shortTtlCache.set("key1", "value1");

            setTimeout(() => {
                // Access the key to update its timestamp
                expect(shortTtlCache.get("key1")).toBe("value1");

                // Should still be available after another short delay
                setTimeout(() => {
                    expect(shortTtlCache.get("key1")).toBe("value1");
                    done();
                }, 300);
            }, 300);
        });
    });

    describe("Access counting", () => {
        it("should track access count for entries", () => {
            cache.set("key1", "value1");

            // Access multiple times
            cache.get("key1");
            cache.get("key1");
            cache.get("key1");

            const topAccessed = cache.getTopAccessed(5);
            expect(topAccessed).toHaveLength(1);
            expect(topAccessed[0].key).toBe("key1");
            expect(topAccessed[0].accessCount).toBe(4); // 3 gets + 1 initial set
        });

        it("should return top accessed items in order", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");

            // Access key2 most, key1 least
            cache.get("key1"); // total: 2 (1 set + 1 get)
            cache.get("key2"); // total: 2
            cache.get("key2"); // total: 3
            cache.get("key2"); // total: 4
            cache.get("key3"); // total: 2

            const topAccessed = cache.getTopAccessed(3);
            expect(topAccessed).toHaveLength(3);
            expect(topAccessed[0].key).toBe("key2");
            expect(topAccessed[0].accessCount).toBe(4);
            expect(topAccessed[1].accessCount).toBe(2);
            expect(topAccessed[2].accessCount).toBe(2);
        });
    });

    describe("Warm up functionality", () => {
        it("should warm up cache with initial data", async () => {
            const data = [
                { key: "key1", value: "value1" },
                { key: "key2", value: "value2" },
                { key: "key3", value: "value3" },
            ];

            await cache.warmUp(data);
            expect(cache.size()).toBe(3);
            expect(await cache.get("key1")).toBe("value1");
            expect(await cache.get("key2")).toBe("value2");
            expect(await cache.get("key3")).toBe("value3");
        });
    });

    describe("Cleanup functionality", () => {
        it("should cleanup expired entries", async () => {
            const shortTtlCache = new CacheService<string>(10, 0.01); // 0.01 minutes = 0.6 seconds

            shortTtlCache.set("key1", "value1");
            shortTtlCache.set("key2", "value2");

            // Wait for entries to expire
            await new Promise((resolve) => setTimeout(resolve, 700));

            const cleanedCount = shortTtlCache.cleanup();
            expect(cleanedCount).toBe(2);
            expect(shortTtlCache.size()).toBe(0);
        });

        it("should not cleanup non-expired entries", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");

            const cleanedCount = cache.cleanup();
            expect(cleanedCount).toBe(0);
            expect(cache.size()).toBe(2);
        });
    });
});
