/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const {
    createOnUpdateTrigger,
    dropOnUpdateTrigger,
    createUpdateAtTriggerFunction,
    dropUpdatedAtTriggerFunction,
} = require("../util/db-util");

exports.up = async function (knex) {
    if (!(await knex.schema.hasTable("url_analytics"))) {
        await knex.schema.createTable("url_analytics", (t) => {
            // Primary key
            t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());

            // Foreign key reference to urls table
            t.uuid("url_id").notNullable();
            t.foreign("url_id").references("id").inTable("urls").onDelete("CASCADE");

            // Request tracking data
            t.string("ip_address", 45).nullable(); // IPv4 (15) or IPv6 (45)
            t.text("user_agent").nullable();
            t.text("referer").nullable();

            // Geographic data (optional)
            t.string("country", 2).nullable(); // ISO country code
            t.string("city", 100).nullable();

            // Device/browser detection (optional)
            t.string("device_type", 50).nullable(); // mobile, desktop, tablet
            t.string("browser", 50).nullable();
            t.string("os", 50).nullable();

            // Timestamp
            t.timestamp("clicked_at").defaultTo(knex.fn.now());

            // Indexes for performance
            t.index("url_id");
            t.index("clicked_at");
            t.index("ip_address");
            t.index("country");
            t.index(["url_id", "clicked_at"]); // Composite index for analytics queries
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    if (await knex.schema.hasTable("url_analytics")) {
        await knex.schema.dropTable("url_analytics");
    }
};
