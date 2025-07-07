/* eslint-disable */
const { execSync } = require("child_process");
const path = require("path");
const promptSync = require("prompt-sync");

const prompt = promptSync({ sigint: true });

const migrationName = prompt("Enter name for migration: ");

// Remove spaces and special characters, replace with hyphens
const formattedMigrationName = migrationName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

console.log(`Creating migration: ${formattedMigrationName}`);

execSync(
  `npx knex migrate:make --knexfile ${path.join(__dirname, "./knexfile.js")} ${formattedMigrationName}`,
  { stdio: "inherit" },
);
