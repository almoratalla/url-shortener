# Redis Cache Integration with Upstash

This document explains how the URL shortener now uses Upstash Redis as the primary caching layer with automatic fallback to in-memory caching.

## Features

-   **Primary Redis Cache**: Uses Upstash Redis for distributed caching
-   **Automatic Fallback**: Falls back to in-memory cache if Redis is unavailable
-   **Connection Recovery**: Automatically attempts to reconnect to Redis
-   **Performance Monitoring**: Tracks Redis connection status and cache performance
-   **Seamless Integration**: No changes needed to existing cache usage

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Upstash Redis (optional - will fallback to in-memory cache if not provided)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

### Getting Upstash Redis Credentials

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token from the database details
4. Add them to your `.env` file

## How It Works

### Cache Hierarchy

1. **Primary**: Upstash Redis (if configured and available)
2. **Fallback**: In-memory LRU cache (always available)

### Automatic Fallback

The cache service automatically:

-   Tries Redis first for all operations
-   Falls back to in-memory cache if Redis fails
-   Attempts to reconnect to Redis every 30 seconds
-   Maintains performance statistics for both systems

### Cache Operations

All cache operations are now async:

```typescript
// Set a value
await cache.set("key", "value");

// Get a value
const value = await cache.get("key");

// Check if key exists
const exists = await cache.has("key");

// Delete a key
await cache.delete("key");

// Clear all keys
await cache.clear();
```

## Performance Benefits

### With Redis

-   **Distributed**: Cache shared across multiple server instances
-   **Persistent**: Cache survives server restarts
-   **Scalable**: Handles large datasets efficiently
-   **Low Latency**: Upstash Redis optimized for speed

### Without Redis (Fallback)

-   **Fast**: In-memory access is extremely fast
-   **Reliable**: Always available as backup
-   **LRU Eviction**: Prevents memory bloat
-   **Zero Config**: Works out of the box

## Monitoring

### Cache Statistics

The cache service provides detailed statistics:

```typescript
const stats = cache.getStats();
console.log(stats);
// {
//   hits: 150,
//   misses: 25,
//   evictions: 5,
//   totalRequests: 175,
//   hitRate: 85.7,
//   redisConnected: true,
//   fallbackActive: false
// }
```

### Performance Monitoring

-   **Cache Stats Endpoint**: `GET /api/cache-stats`
-   **Periodic Logging**: Automatic performance logs
-   **Connection Status**: Real-time Redis connection monitoring

## Error Handling

The cache service gracefully handles:

-   Network connectivity issues
-   Redis server downtime
-   Authentication failures
-   Rate limiting
-   Connection timeouts

When Redis fails, the service:

1. Logs the error
2. Switches to in-memory cache
3. Attempts reconnection after 30 seconds
4. Updates statistics accordingly

## Testing

### Unit Tests

Tests cover both Redis and in-memory scenarios:

```bash
# Run all cache tests
npm test -- --testPathPattern=CacheService

# Run Redis integration tests
npm test -- --testPathPattern=redis
```

### Local Development

For local development without Redis:

1. Don't set Redis environment variables
2. Cache automatically uses in-memory fallback
3. Full functionality maintained

## Migration from In-Memory Only

The migration is seamless:

-   All existing code continues to work
-   Cache methods are now async (add `await`)
-   Statistics include Redis connection status
-   Performance improves automatically with Redis

## Best Practices

1. **Always use await** with cache operations
2. **Handle errors gracefully** in cache operations
3. **Monitor cache statistics** for performance insights
4. **Use appropriate TTL values** for different data types
5. **Test both Redis and fallback scenarios**

## Cache Types

The application uses three cache instances:

1. **URL Cache**: Stores URL records (2000 items, 60 min TTL)
2. **Analytics Cache**: Stores analytics data (1000 items, 15 min TTL)
3. **Redirect Cache**: Stores redirect URLs (5000 items, 120 min TTL)

Each cache operates independently with its own Redis connection and fallback.
