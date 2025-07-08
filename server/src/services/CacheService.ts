/**
 * Cache Service for URL shortener performance optimization
 * Uses Upstash Redis as primary cache with in-memory fallback
 * Implements LRU (Least Recently Used) eviction strategy for fallback
 */

import { Redis } from "@upstash/redis";

interface CacheEntry<T> {
    value: T;
    lastAccessed: number;
    accessCount: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalRequests: number;
    hitRate: number;
    redisConnected: boolean;
    fallbackActive: boolean;
}

export class CacheService<T> {
    private cache = new Map<string, CacheEntry<T>>(); // Fallback in-memory cache
    private redis: Redis | null = null;
    private redisConnected = false;
    private maxSize: number;
    private ttl: number; // Time to live in milliseconds
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalRequests: 0,
        hitRate: 0,
        redisConnected: false,
        fallbackActive: false,
    };

    constructor(maxSize: number = 1000, ttlMinutes: number = 30) {
        this.maxSize = maxSize;
        this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
        this.initializeRedis();
    }

    /**
     * Initialize Redis connection
     */
    private async initializeRedis(): Promise<void> {
        try {
            const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
            const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

            if (!redisUrl || !redisToken) {
                console.warn(
                    "⚠️ Upstash Redis credentials not found. Using in-memory cache only."
                );
                this.stats.fallbackActive = true;
                return;
            }

            this.redis = new Redis({
                url: redisUrl,
                token: redisToken,
            });

            // Test Redis connection
            await this.redis.ping();
            this.redisConnected = true;
            this.stats.redisConnected = true;
            console.log("✅ Connected to Upstash Redis");
        } catch (error) {
            console.error("❌ Failed to connect to Upstash Redis:", error);
            this.redis = null;
            this.redisConnected = false;
            this.stats.fallbackActive = true;
            console.log("📦 Falling back to in-memory cache");
        }
    }

    /**
     * Get value from cache (Redis first, then fallback)
     */
    async get(key: string): Promise<T | null> {
        this.stats.totalRequests++;

        // Try Redis first
        if (this.redisConnected && this.redis) {
            try {
                const redisValue = await this.redis.get(key);
                if (redisValue !== null) {
                    this.stats.hits++;
                    this.updateHitRate();

                    // Parse the stored value
                    const parsedValue =
                        typeof redisValue === "string"
                            ? JSON.parse(redisValue)
                            : redisValue;

                    return parsedValue as T;
                }
            } catch (error) {
                console.error(
                    "❌ Redis get failed, falling back to in-memory:",
                    error
                );
                this.handleRedisError();
            }
        }

        // Fallback to in-memory cache
        return this.getFromMemory(key);
    }

    /**
     * Get from in-memory cache (fallback method)
     */
    private getFromMemory(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }

        // Check if entry has expired
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }

        // Update access time and count
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.stats.hits++;
        this.updateHitRate();

        return entry.value;
    }

    /**
     * Set value in cache (Redis first, then fallback)
     */
    async set(key: string, value: T): Promise<void> {
        // Try Redis first
        if (this.redisConnected && this.redis) {
            try {
                const ttlSeconds = Math.floor(this.ttl / 1000);
                await this.redis.setex(key, ttlSeconds, JSON.stringify(value));

                // Also store in memory for faster access
                this.setInMemory(key, value);
                return;
            } catch (error) {
                console.error(
                    "❌ Redis set failed, falling back to in-memory:",
                    error
                );
                this.handleRedisError();
            }
        }

        // Fallback to in-memory cache
        this.setInMemory(key, value);
    }

    /**
     * Set in memory cache (fallback method)
     */
    private setInMemory(key: string, value: T): void {
        // If cache is at max size, evict LRU entry
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const now = Date.now();
        this.cache.set(key, {
            value,
            lastAccessed: now,
            accessCount: 1,
        });
    }

    /**
     * Handle Redis connection errors
     */
    private handleRedisError(): void {
        this.redisConnected = false;
        this.stats.redisConnected = false;
        this.stats.fallbackActive = true;

        // Attempt to reconnect after a delay
        setTimeout(() => {
            this.initializeRedis();
        }, 30000); // Retry after 30 seconds
    }

    /**
     * Delete value from cache (Redis and fallback)
     */
    async delete(key: string): Promise<boolean> {
        let deleted = false;

        // Delete from Redis
        if (this.redisConnected && this.redis) {
            try {
                const redisDeleted = await this.redis.del(key);
                deleted = redisDeleted > 0;
            } catch (error) {
                console.error("❌ Redis delete failed:", error);
                this.handleRedisError();
            }
        }

        // Delete from in-memory cache
        const memoryDeleted = this.cache.delete(key);

        return deleted || memoryDeleted;
    }

    /**
     * Clear all cache entries (Redis and fallback)
     */
    async clear(): Promise<void> {
        // Clear Redis
        if (this.redisConnected && this.redis) {
            try {
                await this.redis.flushall();
            } catch (error) {
                console.error("❌ Redis clear failed:", error);
                this.handleRedisError();
            }
        }

        // Clear in-memory cache
        this.cache.clear();
        this.resetStats();
    }

    /**
     * Check if cache has key (Redis first, then fallback)
     */
    async has(key: string): Promise<boolean> {
        // Check Redis first
        if (this.redisConnected && this.redis) {
            try {
                const exists = await this.redis.exists(key);
                if (exists > 0) return true;
            } catch (error) {
                console.error("❌ Redis exists failed:", error);
                this.handleRedisError();
            }
        }

        // Check in-memory cache
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Warm cache with initial data (Redis and fallback)
     */
    async warmUp(data: Array<{ key: string; value: T }>): Promise<void> {
        console.log(`🔥 Warming up cache with ${data.length} entries...`);

        for (const { key, value } of data) {
            await this.set(key, value);
        }

        console.log(
            `✅ Cache warmed up successfully. Redis: ${
                this.redisConnected
            }, In-memory: ${this.size()}`
        );
    }

    /**
     * Cleanup expired entries (in-memory only, Redis handles TTL automatically)
     */
    cleanup(): number {
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    /**
     * Get top accessed keys
     */
    getTopAccessed(
        limit: number = 10
    ): Array<{ key: string; accessCount: number }> {
        const entries = Array.from(this.cache.entries())
            .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit);

        return entries;
    }

    private isExpired(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.lastAccessed > this.ttl;
    }

    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    private updateHitRate(): void {
        this.stats.hitRate =
            this.stats.totalRequests > 0
                ? (this.stats.hits / this.stats.totalRequests) * 100
                : 0;
    }

    private resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0,
            hitRate: 0,
            redisConnected: this.redisConnected,
            fallbackActive: this.stats.fallbackActive,
        };
    }
}

// URL-specific cache interface
export interface CachedUrl {
    id: string;
    original_url: string;
    short_code: string;
    custom_slug?: string;
    expiration_date?: Date;
    click_count: number;
    created_at: Date;
    updated_at: Date;
    last_accessed?: Date;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

// Analytics cache interface
export interface CachedAnalytics {
    url: any; // UrlRecord
    analytics: any[];
    summary: {
        totalClicks: number;
        uniqueClicks: number;
        clicksByDay: any[];
    };
}

// Create singleton cache instances
export const urlCache = new CacheService<CachedUrl>(2000, 60); // 2000 URLs, 60 min TTL
export const analyticsCache = new CacheService<CachedAnalytics>(1000, 15); // 1000 analytics, 15 min TTL
export const redirectCache = new CacheService<string>(5000, 120); // 5000 redirects, 2 hour TTL

// Cache warming functionality
export async function warmUrlCache(knex: any): Promise<void> {
    try {
        console.log("🔥 Starting cache warm-up...");

        // Get most frequently accessed URLs
        const popularUrls = await knex("urls")
            .select("*")
            .orderBy("click_count", "desc")
            .limit(1000);

        // Warm URL cache
        const urlData = popularUrls.map((url: any) => ({
            key: url.short_code,
            value: url as CachedUrl,
        }));

        await urlCache.warmUp(urlData);

        // Also cache by custom slug if exists
        const customSlugData = popularUrls
            .filter((url: any) => url.custom_slug)
            .map((url: any) => ({
                key: url.custom_slug,
                value: url as CachedUrl,
            }));

        if (customSlugData.length > 0) {
            await urlCache.warmUp(customSlugData);
        }

        console.log("✅ Cache warm-up completed successfully");
    } catch (error) {
        console.error("❌ Cache warm-up failed:", error);
    }
}

// Performance monitoring middleware
export function createCacheMiddleware() {
    return (req: any, res: any, next: any) => {
        const start = Date.now();

        res.on("finish", () => {
            const duration = Date.now() - start;

            // Log slow requests
            if (duration > 1000) {
                console.warn(
                    `⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`
                );
            }

            // Log cache stats periodically
            if (Math.random() < 0.01) {
                // 1% of requests
                const urlStats = urlCache.getStats();
                const analyticsStats = analyticsCache.getStats();
                const redirectStats = redirectCache.getStats();

                console.log("📊 Cache Performance:", {
                    url: `${urlStats.hitRate.toFixed(2)}% hit rate (${
                        urlStats.hits
                    }/${urlStats.totalRequests}) | Redis: ${
                        urlStats.redisConnected ? "✅" : "❌"
                    } | Fallback: ${urlStats.fallbackActive ? "⚠️" : "✅"}`,
                    analytics: `${analyticsStats.hitRate.toFixed(
                        2
                    )}% hit rate (${analyticsStats.hits}/${
                        analyticsStats.totalRequests
                    }) | Redis: ${
                        analyticsStats.redisConnected ? "✅" : "❌"
                    } | Fallback: ${
                        analyticsStats.fallbackActive ? "⚠️" : "✅"
                    }`,
                    redirects: `${redirectStats.hitRate.toFixed(
                        2
                    )}% hit rate (${redirectStats.hits}/${
                        redirectStats.totalRequests
                    }) | Redis: ${
                        redirectStats.redisConnected ? "✅" : "❌"
                    } | Fallback: ${
                        redirectStats.fallbackActive ? "⚠️" : "✅"
                    }`,
                });
            }
        });

        next();
    };
}

// Cleanup job for expired entries
export function startCacheCleanup(): void {
    const cleanupInterval = 5 * 60 * 1000; // 5 minutes

    setInterval(() => {
        const urlCleaned = urlCache.cleanup();
        const analyticsCleaned = analyticsCache.cleanup();
        const redirectCleaned = redirectCache.cleanup();

        const totalCleaned = urlCleaned + analyticsCleaned + redirectCleaned;

        if (totalCleaned > 0) {
            console.log(
                `🧹 Cache cleanup: removed ${totalCleaned} expired entries`
            );
        }
    }, cleanupInterval);
}
