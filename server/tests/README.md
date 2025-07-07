# 🧪 Test Suite Documentation

## Overview

Comprehensive test suite for the URL Shortener API covering all endpoints, services, and utility functions.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and setup
├── simple.test.ts              # Simple smoke test
├── controllers/
│   └── UrlController.test.ts   # Controller unit tests
├── services/
│   └── UrlService.test.ts      # Service layer tests
├── utils/
│   ├── urlGenerator.test.ts    # URL generation utilities
│   └── validators.test.ts      # Validation utilities
└── integration/
    └── api.test.ts            # End-to-end API tests
```

## Test Categories

### 1. Unit Tests

#### Controller Tests (`controllers/UrlController.test.ts`)

-   ✅ **POST /api/shorten** - URL shortening endpoint
-   ✅ **GET /api/urls** - List URLs with pagination
-   ✅ **GET /api/urls/:id** - Get specific URL with analytics
-   ✅ **DELETE /api/urls/:id** - Delete URL
-   ✅ **GET /api/urls/:id/analytics** - Get URL analytics
-   ✅ **GET /r/:shortCode** - Redirect handling

#### Service Tests (`services/UrlService.test.ts`)

-   ✅ **createShortUrl** - Business logic for URL creation
-   ✅ **getAllUrls** - Pagination and filtering
-   ✅ **deleteUrl** - URL deletion logic
-   ✅ **handleRedirect** - Redirect with analytics tracking
-   ✅ **getUrlAnalytics** - Analytics aggregation

#### Utility Tests (`utils/`)

-   ✅ **urlGenerator.test.ts** - Short code generation, validation
-   ✅ **validators.test.ts** - URL validation, UTM params, expiration

### 2. Integration Tests

#### API Integration Tests (`integration/api.test.ts`)

-   ✅ **Real database interactions** - Uses test database
-   ✅ **Full request/response cycle** - Tests complete API flow
-   ✅ **Error handling** - Validates error responses
-   ✅ **Data persistence** - Verifies database operations

## Test Coverage

### Endpoints Tested

1. **POST /api/shorten**

    - ✅ Basic URL shortening
    - ✅ Custom slug handling
    - ✅ Expiration date validation
    - ✅ UTM parameter support
    - ✅ Error handling (invalid URLs, duplicate slugs)

2. **GET /api/urls**

    - ✅ Pagination (page, limit)
    - ✅ Empty results handling
    - ✅ Data formatting

3. **GET /api/urls/:id**

    - ✅ URL details with analytics
    - ✅ 404 handling for non-existent URLs
    - ✅ Analytics summary calculation

4. **DELETE /api/urls/:id**

    - ✅ Successful deletion
    - ✅ 404 handling
    - ✅ Cascade deletion of analytics

5. **GET /r/:shortCode**

    - ✅ Redirect to original URL
    - ✅ UTM parameter appending
    - ✅ Analytics tracking
    - ✅ Expiration handling
    - ✅ Custom slug support

6. **GET /api/urls/:id/analytics**
    - ✅ Detailed analytics retrieval
    - ✅ Summary calculations
    - ✅ Recent clicks limiting

### Business Logic Tested

-   ✅ **URL Validation** - Format, protocol, length checks
-   ✅ **Short Code Generation** - Uniqueness, format, collision handling
-   ✅ **Custom Slug Validation** - Availability, format rules
-   ✅ **Expiration Handling** - Date validation, expiry checks
-   ✅ **UTM Parameters** - Validation, URL building
-   ✅ **Analytics Tracking** - Click counting, data collection
-   ✅ **Error Handling** - Proper error responses and status codes

### Edge Cases Tested

-   ✅ **Invalid URLs** - Malformed, unsupported protocols
-   ✅ **Duplicate Slugs** - Custom slug conflicts
-   ✅ **Expired URLs** - Redirect blocking
-   ✅ **Missing Data** - Required field validation
-   ✅ **Database Errors** - Connection issues, query failures
-   ✅ **Rate Limiting** - Request throttling
-   ✅ **Large Datasets** - Pagination limits

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test Files

```bash
# Controller tests
npm test -- --testPathPatterns=UrlController.test.ts

# Service tests
npm test -- --testPathPatterns=UrlService.test.ts

# Integration tests
npm test -- --testPathPatterns=api.test.ts

# Utility tests
npm test -- --testPathPatterns=urlGenerator.test.ts
npm test -- --testPathPatterns=validators.test.ts
```

## Test Database Setup

The integration tests use a separate test database to avoid conflicts with development data:

```typescript
// Test database configuration
process.env.DB_CONNECTION_URI =
    "postgres://symph:symph@localhost:5433/symph_test";
```

### Database Lifecycle

-   **beforeAll**: Run migrations
-   **beforeEach**: Clean test data
-   **afterAll**: Rollback migrations, close connections

## Mock Strategy

### Unit Tests

-   Mock external dependencies (database, services)
-   Test business logic in isolation
-   Fast execution, no external dependencies

### Integration Tests

-   Use real database connections
-   Test complete request/response cycle
-   Validate actual data persistence

## Test Data

### Sample URLs

-   `https://example.com` - Basic URL
-   `https://google.com` - Alternative URL
-   `https://example.com/path?param=value` - Complex URL

### Sample UTM Parameters

```json
{
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer-sale",
    "utm_term": "keyword",
    "utm_content": "ad1"
}
```

### Sample Analytics Data

```json
{
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0",
    "referer": "https://google.com"
}
```

## Performance Considerations

-   Tests run in parallel where possible
-   Database cleanup between tests
-   Reasonable timeouts (10 seconds)
-   Memory-efficient mock objects

## Coverage Goals

-   **Lines**: > 90%
-   **Functions**: > 95%
-   **Branches**: > 85%
-   **Statements**: > 90%

## Continuous Integration

Tests are designed to run in CI/CD environments:

-   No external dependencies (except test database)
-   Deterministic results
-   Proper cleanup and teardown
-   Clear error messages

## Test Maintenance

-   Keep tests up to date with API changes
-   Add tests for new features
-   Remove tests for deprecated functionality
-   Regular test performance reviews

This comprehensive test suite ensures the URL Shortener API is reliable, secure, and performs as expected under various conditions.
