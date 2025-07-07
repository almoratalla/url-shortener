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
  if (!(await knex.schema.hasTable("urls"))) {
    await knex.schema.createTable("urls", (t) => {
      // Primary key
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      
      // URL data
      t.text("original_url").notNullable();
      t.string("short_code", 8).unique().notNullable();
      t.string("custom_slug", 50).unique().nullable();
      t.timestamp("expiration_date").nullable();
      
      // UTM Parameters
      t.string("utm_source", 255).nullable();
      t.string("utm_medium", 255).nullable();
      t.string("utm_campaign", 255).nullable();
      t.string("utm_term", 255).nullable();
      t.string("utm_content", 255).nullable();
      
      // Analytics
      t.integer("click_count").defaultTo(0);
      t.timestamp("last_accessed").nullable();
      
      // Timestamps
      t.timestamp("created_at").defaultTo(knex.fn.now());
      t.timestamp("updated_at").defaultTo(knex.fn.now());
      
      // Indexes for performance
      t.index("short_code");
      t.index("custom_slug");
      t.index("expiration_date");
      t.index("created_at");
    });

    await createUpdateAtTriggerFunction(knex);
    // needed to auto update the updated_at column
    await createOnUpdateTrigger(knex, "urls");
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("urls")) {
    await knex.schema.dropTable("urls");
    await dropOnUpdateTrigger(knex, "urls");
    await dropUpdatedAtTriggerFunction(knex);
  }
};
