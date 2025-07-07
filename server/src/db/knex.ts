import { knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const environment = process.env.NODE_ENV || "development";

// Import the knex configuration
const knexConfig = require("./knexfile.js");
const config = knexConfig[environment];

export const db = knex(config);
