const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../../.env") });
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "postgres",
    connection: {
      connectionString: process.env.DB_CONNECTION_URI,
    },
    migrations: {
      directory: path.join(__dirname, "./migrations"),
    },
  },
  test: {
    client: "postgres",
    connection: {
      connectionString: process.env.DB_CONNECTION_URI || "postgres://symph:symph@localhost:5433/symph_test",
    },
    migrations: {
      directory: path.join(__dirname, "./migrations"),
    },
  },
  production: {
    client: "postgres",
    connection: {
      connectionString: process.env.DATABASE_URL,
    },
    migrations: {
      directory: path.join(__dirname, "./migrations"),
    },
  },
};
