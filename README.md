# URL Shortener - Full-Stack Application

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-20+-blue.svg)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

A modern, full-stack URL shortener application built with **React + Vite**, **Express.js**, and **PostgreSQL**. Features intelligent caching with Redis, comprehensive analytics, and a beautiful UI built with shadcn/ui components.

## ✨ Features

### 🚀 Core Functionality
- **URL Shortening**: Generate short, memorable URLs for any link
- **Custom Slugs**: Create personalized short URLs with custom slugs
- **Expiration Dates**: Set automatic expiration for temporary links
- **UTM Parameter Support**: Advanced UTM parameter management for marketing campaigns
- **Click Tracking**: Real-time analytics and click counting

### 🔥 Advanced Features
- **Intelligent Multi-Layer Caching**: Redis + in-memory fallback with cache warming
- **Real-time Analytics**: Comprehensive click tracking and user analytics
- **Cache Statistics Dashboard**: Monitor cache performance and hit rates
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Toast Notifications**: User-friendly feedback with Sonner toasts
- **Error Handling**: Robust error handling with meaningful messages

### 🛠 Technical Features
- **Client-Side Routing**: React Router for seamless navigation
- **Type Safety**: Full TypeScript implementation
- **Database Migrations**: Automated schema management with Knex.js
- **Docker Support**: Complete containerization for easy deployment
- **Environment Configuration**: Flexible configuration for different environments
- **Rate Limiting**: Built-in protection against abuse

## 🚀 Quick Start

### Prerequisites

-   **Docker & Docker Compose** (v20.10+)
-   **Node.js** (v20+)
-   **Git** (recommended)

### Installation & Setup

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd url-shortener
    ```

2. **Install dependencies:**

    ```bash
    # Frontend dependencies
    cd client && npm install

    # Backend dependencies
    cd ../server && npm install

    # Return to root
    cd ..
    ```

3. **Start the application:**

    ```bash
    # Start all services with Docker Compose
    docker compose -f docker-compose.minimal.yml up --build
    ```

4. **Access the application:**
    - 🌐 **Frontend**: http://localhost:3000
    - 🔗 **Backend API**: http://localhost:8000
    - 🗄️ **Database**: localhost:5433 (PostgreSQL)

## 🏗️ Architecture & Technology Stack

### Frontend
| Technology | Purpose | Features |
|------------|---------|----------|
| **React 18** | UI Framework | Hooks, Suspense, Error Boundaries |
| **Vite** | Build Tool | Fast HMR, optimized builds |
| **TypeScript** | Type Safety | Full type coverage, better DX |
| **Tailwind CSS** | Styling | Utility-first, responsive design |
| **shadcn/ui** | UI Components | Beautiful, accessible components |
| **React Router** | Routing | Client-side navigation |
| **Sonner** | Notifications | Toast notifications |

### Backend
| Technology | Purpose | Features |
|------------|---------|----------|
| **Express.js** | Web Framework | RESTful APIs, middleware |
| **TypeScript** | Type Safety | Type-safe server development |
| **Knex.js** | Query Builder | SQL query builder, migrations |
| **PostgreSQL 16** | Database | Reliable data persistence |
| **Redis** | Caching | Multi-layer intelligent caching |
| **Docker** | Containerization | Easy deployment and scaling |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Docker Compose** | Local development |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Testing framework |

### Project Structure

```
url-shortener/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── pages/            # React page components
│   │   ├── assets/           # Static assets
│   │   └── main.tsx          # Application entry point
│   ├── public/               # Public assets
│   └── package.json
├── server/                   # Express.js backend application
│   ├── src/
│   │   ├── db/              # Database configuration and migrations
│   │   │   ├── migrations/  # Database schema migrations
│   │   │   └── knex.ts      # Database connection
│   │   └── rest-api.ts      # API routes and logic
│   └── package.json
├── docker-compose.minimal.yml # Docker services configuration
└── README.md                 # This file
```

## 🔧 Development

### Environment Configuration

The application uses environment variables for configuration:

#### Database Connection

```env
DB_CONNECTION_URI=postgres://symph:symph@localhost:5433/symph?sslmode=disable
```

#### Service Ports

-   **Frontend**: 3000
-   **Backend**: 8000
-   **Database**: 5433 (mapped from container port 5432)

### Database Management

#### Migration Commands

```bash
# Create a new migration
npm run migration:new -- migration_name

# Run pending migrations
npm run migration:latest

# Rollback last migration
npm run migration:rollback

# Check migration status
npm run migration:status
```

#### Database Schema

The application includes example tables:

-   `example_foreign_table` - Main data table
-   `example_table` - Reference table
-   `knex_migrations` - Migration tracking
-   `knex_migrations_lock` - Migration locking

#### Database Access

You can connect to the PostgreSQL database using:

-   **Host**: localhost
-   **Port**: 5433
-   **Database**: symph
-   **Username**: symph
-   **Password**: symph

### API Endpoints

#### Available Routes

| Method | Endpoint    | Description               |
| ------ | ----------- | ------------------------- |
| `GET`  | `/`         | Health check and info     |
| `GET`  | `/examples` | Fetch all example records |
| `POST` | `/examples` | Create new example record |

#### Example API Usage

```bash
# Get all examples
curl http://localhost:8000/examples

# Create new example
curl -X POST http://localhost:8000/examples \
  -H "Content-Type: application/json" \
  -d '{"name":"test","authMethod":"TEST"}'
```

## 🐳 Docker Configuration

### Services

The application runs in containerized services:

#### Database Service

-   **Image**: postgres:16
-   **Port**: 5433:5432
-   **Volume**: postgres-data (persistent storage)
-   **Health Check**: Automatic PostgreSQL readiness check

#### Backend Service

-   **Build**: ./server (Dockerfile.dev)
-   **Port**: 8000:8000
-   **Dependencies**: Database health check
-   **Auto-restart**: On file changes (nodemon)

#### Frontend Service

-   **Build**: ./client (Dockerfile.dev)
-   **Port**: 3000:3000
-   **Dependencies**: Backend service
-   **Hot Reload**: Enabled for development

#### Migration Service

-   **Purpose**: Automatic database schema updates
-   **Execution**: Runs once on startup
-   **Dependencies**: Database health check

### Docker Commands

```bash
# Start all services
docker-compose -f docker-compose.minimal.yml up --build

# Stop all services
docker-compose -f docker-compose.minimal.yml down

# View logs
docker-compose -f docker-compose.minimal.yml logs -f

# Rebuild specific service
docker-compose -f docker-compose.minimal.yml up --build backend
```

## 🔍 Testing & Debugging

### Database Connection Testing

```bash
# Test database connectivity
docker exec -it url-shortener-db-1 psql -U symph -d symph -c "SELECT current_database(), current_user;"

# View database tables
docker exec -it url-shortener-db-1 psql -U symph -d symph -c "\dt"
```

### API Testing

```bash
# Test API health
curl http://localhost:8000/

# Test database operations
curl -X POST http://localhost:8000/examples \
  -H "Content-Type: application/json" \
  -d '{"name":"test","authMethod":"TEST"}'
```

## 🛠️ Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `client/src/` - hot reload enabled
2. **Backend Changes**: Edit files in `server/src/` - nodemon restarts automatically
3. **Database Changes**: Create migrations in `server/src/db/migrations/`

### Common Development Tasks

```bash
# Install new frontend dependency
cd client && npm install <package-name>

# Install new backend dependency
cd server && npm install <package-name>

# Create database migration
cd server && npm run migration:new -- add_new_table

# Reset database (careful!)
docker-compose -f docker-compose.minimal.yml down -v
docker-compose -f docker-compose.minimal.yml up --build
```

## 📦 Production Deployment

### Build Process

```bash
# Build frontend for production
cd client && npm run build

# The application is containerized and ready for deployment
```

### Environment Variables

Ensure these are set in production:

-   `NODE_ENV=production`
-   `DB_CONNECTION_URI=<production-database-url>`
-   `PORT=8000`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is part of the Symph coding assignment.

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts

If you encounter port conflicts:

```bash
# Check what's using the ports
netstat -an | findstr :5432
netstat -an | findstr :3000
netstat -an | findstr :8000
```

#### Database Connection Issues

-   Ensure Docker is running
-   Check if local PostgreSQL is conflicting (port 5432)
-   Verify database credentials in environment variables

#### Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.minimal.yml build --no-cache
```

## 📞 Support

For questions or issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review Docker logs: `docker-compose logs`
3. Contact the Symph careers team

---

**Note**: This application is configured for development. For production deployment, additional security and performance configurations should be implemented.
