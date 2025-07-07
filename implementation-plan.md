# 🚀 URL Shortener Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for building a URL shortener application as per the Symph coding challenge requirements.

## Phase 1: Database Design & Migrations (Priority: High)

### 1.1 Create URL Storage Table

```sql
-- Migration: urls table
- id (UUID, Primary Key)
- original_url (TEXT, NOT NULL)
- short_code (VARCHAR(8), UNIQUE, NOT NULL)
- custom_slug (VARCHAR(50), UNIQUE, NULLABLE)
- expiration_date (TIMESTAMP, NULLABLE)
- utm_source (VARCHAR(255), NULLABLE)
- utm_medium (VARCHAR(255), NULLABLE)
- utm_campaign (VARCHAR(255), NULLABLE)
- utm_term (VARCHAR(255), NULLABLE)
- utm_content (VARCHAR(255), NULLABLE)
- click_count (INTEGER, DEFAULT 0)
- created_at (TIMESTAMP, DEFAULT NOW())
- updated_at (TIMESTAMP, DEFAULT NOW())
- last_accessed (TIMESTAMP, NULLABLE)
```

### 1.2 Create Analytics Table (Optional Enhancement)

```sql
-- Migration: url_analytics table
- id (UUID, Primary Key)
- url_id (UUID, Foreign Key)
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- referer (TEXT)
- country (VARCHAR(2))
- city (VARCHAR(100))
- clicked_at (TIMESTAMP, DEFAULT NOW())
```

## Phase 2: Backend API Development (Priority: High)

### 2.1 Core API Endpoints

```typescript
POST /api/shorten
- Input: { originalUrl, customSlug?, expirationDate?, utmParams? }
- Output: { shortUrl, shortCode, originalUrl, expirationDate }

GET /api/urls
- List all shortened URLs (with pagination)
- Include analytics data

GET /api/urls/:id
- Get specific URL details with analytics

DELETE /api/urls/:id
- Delete a shortened URL

GET /:shortCode
- Redirect to original URL
- Track analytics
- Handle expiration
```

### 2.2 URL Shortening Logic

```typescript
// Core functions to implement:
1. generateShortCode() - 8-character alphanumeric
2. validateUrl() - URL format validation
3. checkExpiration() - Expiration date validation
4. buildUtmUrl() - Append UTM parameters
5. trackAnalytics() - Record click data
```

### 2.3 Performance Optimization

**Caching Strategy:**

```typescript
// Redis-like caching (using in-memory Map for simplicity)
1. Cache frequently accessed URLs
2. Implement LRU eviction
3. Cache hit/miss tracking
4. Warm cache on server start
```

## Phase 3: Frontend Development (Priority: High)

### 3.1 Main URL Shortener Interface

```typescript
// Components to create:
1. URLShortenForm.tsx - Main form component
2. URLResult.tsx - Display shortened URL
3. URLList.tsx - List all URLs
4. URLAnalytics.tsx - Analytics dashboard
5. UTMBuilder.tsx - UTM parameter builder
```

### 3.2 Core Features

```typescript
// Features to implement:
1. URL validation (client-side)
2. Copy to clipboard functionality
3. QR code generation
4. Expiration date picker
5. Custom slug input
6. UTM parameter builder
7. Analytics visualization
```

## Phase 4: Advanced Features (Optional Enhancements)

### 4.1 Performance Features

-   Rate limiting for API endpoints
-   Bulk URL shortening
-   URL preview before shortening
-   Duplicate URL detection

### 4.2 Analytics Features

-   Click tracking with geolocation
-   Referrer analysis
-   Device/browser detection
-   Time-based analytics charts

### 4.3 User Experience

-   Dark/light theme toggle
-   Responsive design
-   Progressive Web App (PWA)
-   Export analytics to CSV

## Phase 5: Implementation Steps

### Step 1: Database Setup (30 minutes)

```bash
# Create migration files
npm run migration:new create_urls_table
npm run migration:new create_analytics_table
npm run migration:latest
```

### Step 2: Backend Core (2 hours)

```typescript
// File structure:
server/src/
├── models/
│   ├── Url.ts
│   └── Analytics.ts
├── services/
│   ├── UrlService.ts
│   ├── AnalyticsService.ts
│   └── CacheService.ts
├── controllers/
│   ├── UrlController.ts
│   └── AnalyticsController.ts
├── middleware/
│   ├── validation.ts
│   └── rateLimiter.ts
└── utils/
    ├── urlGenerator.ts
    └── validators.ts
```

### Step 3: Frontend Core (2 hours)

```typescript
// File structure:
client/src/
├── components/
│   ├── URLShortener/
│   │   ├── URLForm.tsx
│   │   ├── URLResult.tsx
│   │   └── URLList.tsx
│   ├── Analytics/
│   │   ├── AnalyticsDashboard.tsx
│   │   └── ClickChart.tsx
│   └── shared/
│       ├── CopyButton.tsx
│       └── QRCode.tsx
├── hooks/
│   ├── useUrlShortener.ts
│   └── useAnalytics.ts
├── services/
│   └── apiService.ts
└── utils/
    └── validators.ts
```

### Step 4: Integration & Testing (1 hour)

-   End-to-end testing
-   Error handling
-   Edge case validation
-   Performance optimization

## Phase 6: Deployment Preparation

### 6.1 Docker Configuration

```yaml
# Update docker-compose.yml
- Add Redis for caching (optional)
- Environment variables validation
- Health checks
- Volume persistence
```

### 6.2 Environment Variables

```bash
# Required .env variables
DB_CONNECTION_URI=postgres://symph:symph@db:5432/symph
REDIS_URL=redis://redis:6379 (optional)
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
```

## 🎯 Success Metrics

### Functional Requirements:

✅ URL shortening with 8-character codes  
✅ Custom slug support  
✅ Expiration date handling  
✅ UTM parameter support  
✅ Click tracking  
✅ Copy to clipboard

### Technical Requirements:

✅ RESTful API design  
✅ Database normalization  
✅ Error handling  
✅ Input validation  
✅ Performance optimization  
✅ Docker deployment

### Bonus Features:

✅ Analytics dashboard  
✅ QR code generation  
✅ Bulk operations  
✅ Rate limiting  
✅ Responsive design

## 📋 Implementation Timeline

**Total Estimated Time: 6-8 hours**

1. **Database (30 min)** - Migrations and schema
2. **Backend Core (2 hours)** - API endpoints and logic
3. **Frontend Core (2 hours)** - UI components and integration
4. **Advanced Features (2 hours)** - Analytics and enhancements
5. **Testing & Polish (1 hour)** - Bug fixes and optimization

## Progress Tracking

-   [x] Phase 1.1: URLs table migration ✅ COMPLETE
-   [x] Phase 1.2: Analytics table migration ✅ COMPLETE
-   [ ] Phase 2.1: Core API endpoints
-   [ ] Phase 2.2: URL shortening logic
-   [ ] Phase 2.3: Performance optimization
-   [ ] Phase 3.1: Frontend interface
-   [ ] Phase 3.2: Core features
-   [ ] Phase 4: Advanced features
-   [ ] Phase 5: Integration & testing
-   [ ] Phase 6: Deployment preparation

This plan provides a structured approach to building a feature-complete URL shortener that meets all requirements while leaving room for creative enhancements!
