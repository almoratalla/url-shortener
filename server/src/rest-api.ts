import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger, rateLimiter } from "./middleware";
import {
    warmUrlCache,
    startCacheCleanup,
    createCacheMiddleware,
    urlCache,
    analyticsCache,
    redirectCache,
    optimizeCache,
} from "./services/CacheService";
import { db } from "./db/knex";

dotenv.config();

const app = express();

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:4173",
            "https://url-shortener-0jr9.onrender.com",
            "https://url-shortener-almoratalla.netlify.app", // Add your Netlify domain here
            // Add any other domains that should be allowed to access the API
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());
app.use(requestLogger);
app.use(createCacheMiddleware()); // Performance monitoring
app.use(rateLimiter()); // Rate limiting

/*
##################################################
||                                              ||
||              Example endpoints               ||
||                                              ||
##################################################
*/

// Root endpoint - Returns a simple hello world message and default client port
app.get("/", async (_req, res) => {
    res.json({ hello: "world", "client-default-port": 3000 });
});

// GET /examples - Fetches all records from the example_foreign_table
app.get("/examples", async (_req, res) => {
    const docs = await db("example_foreign_table").select("*");
    res.json({ docs });
});

// POST /examples - Creates a new record with auth method and name, returns the created document
app.post("/examples", async (req, res) => {
    const { authMethod, name } = req.body;
    const [doc] = await db("example_foreign_table")
        .insert({
            authMethod,
            name,
        })
        .returning("*");
    res.json({ doc });
});

// URL shortener routes
app.use(routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Cache status endpoint for monitoring
app.get("/api/cache-stats", (_req, res) => {
    res.json({
        url: urlCache.getStats(),
        analytics: analyticsCache.getStats(),
        redirects: redirectCache.getStats(),
        sizes: {
            url: urlCache.size(),
            analytics: analyticsCache.size(),
            redirects: redirectCache.size(),
        },
    });
});

const PORT = process.env.PORT || 8000;

// Initialize caching and start server
async function startServer() {
    try {
        console.log("🚀 Starting URL shortener server...");

        // Start cache cleanup process
        startCacheCleanup();
        console.log("✅ Cache cleanup and optimization started");

        // Warm up cache with popular URLs
        await warmUrlCache(db);
        console.log("✅ Cache warmed up successfully");

        // Start cache optimization
        optimizeCache();
        console.log("✅ Cache optimization started");

        app.listen(PORT, () => {
            console.log(`✅ Server has started on port ${PORT}`);
            console.log(
                `📊 Cache stats endpoint: http://localhost:${PORT}/api/cache-stats`
            );
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
