import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";
process.env.DB_CONNECTION_URI =
    process.env.DB_CONNECTION_URI ||
    "postgres://symph:symph@localhost:5433/symph_test";

// Global test utilities
declare global {
    namespace NodeJS {
        interface Global {
            console: Console;
        }
    }
}
