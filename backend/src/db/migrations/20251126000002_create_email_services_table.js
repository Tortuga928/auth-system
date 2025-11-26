/**
 * Migration: Create email_services table
 *
 * Stores email service provider configurations with encrypted credentials
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('email_services', (table) => {
    // Primary key
    table.increments('id').primary();

    // Display name for this configuration
    table.string('name', 100).notNullable();

    // Provider type: sendgrid, ses, smtp
    table.string('provider_type', 20).notNullable();

    // Non-sensitive configuration (JSON)
    // For SendGrid: { from_email, from_name }
    // For SES: { region, from_email, from_name }
    // For SMTP: { host, port, security, from_email, from_name }
    table.jsonb('config').notNullable().defaultTo('{}');

    // Encrypted credentials (JSON) - AES-256 encrypted
    // For SendGrid: { api_key }
    // For SES: { access_key_id, secret_access_key }
    // For SMTP: { username, password }
    table.text('credentials_encrypted').notNullable();

    // Status flags
    table.boolean('is_active').notNullable().defaultTo(false);
    table.boolean('is_enabled').notNullable().defaultTo(true);

    // Last test result
    table.string('last_test_status', 20).nullable(); // success, failed, never_tested
    table.timestamp('last_test_at').nullable();
    table.text('last_test_error').nullable();

    // Audit fields
    table.integer('created_by').unsigned().notNullable();
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('updated_by').unsigned().nullable();
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('provider_type');
    table.index('is_active');
    table.index('is_enabled');
    table.index('created_by');
  });

  console.log('✅ Created email_services table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('email_services');
  console.log('✅ Dropped email_services table');
};
