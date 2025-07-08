/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
    // Drop and recreate the trigger function with correct column reference
    await knex.raw(`
        DROP FUNCTION IF EXISTS on_update_timestamp() CASCADE;
    `);

    await knex.raw(`
        CREATE OR REPLACE FUNCTION on_update_timestamp() RETURNS TRIGGER AS $$ 
        BEGIN 
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Recreate the trigger on the urls table
    await knex.raw(`
        DROP TRIGGER IF EXISTS "urls_updatedAt" ON urls;
    `);

    await knex.raw(`
        CREATE TRIGGER "urls_updatedAt"
        BEFORE UPDATE ON urls
        FOR EACH ROW
        EXECUTE PROCEDURE on_update_timestamp();
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Drop the trigger and function
    await knex.raw(`
        DROP TRIGGER IF EXISTS "urls_updatedAt" ON urls;
    `);

    await knex.raw(`
        DROP FUNCTION IF EXISTS on_update_timestamp() CASCADE;
    `);
};
