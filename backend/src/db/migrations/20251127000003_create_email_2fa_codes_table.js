/**
 * Migration: Create email_2fa_codes table
 *
 * Purpose: Store temporary email 2FA verification codes
 * Codes are hashed and have expiration times
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.3)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('email_2fa_codes', (table) => {
    // Primary key
    table.increments('id').primary();

    // User reference
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // Code (hashed for security)
    table.string('code_hash', 255).notNullable();

    // Expiration timestamp
    table.timestamp('expires_at').notNullable();

    // Attempt tracking
    table.integer('attempts').notNullable().defaultTo(0);

    // Lockout timestamp (null if not locked)
    table.timestamp('locked_until').nullable();

    // Resend tracking
    table.integer('resend_count').notNullable().defaultTo(0);
    table.timestamp('last_resend_at').nullable();

    // Whether this code has been used (one-time use)
    table.boolean('used').notNullable().defaultTo(false);

    // Creation timestamp
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for performance
    table.index('user_id');
    table.index('expires_at');
    table.index(['user_id', 'used']); // For finding active codes
  });

  console.log('✅ Created email_2fa_codes table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('email_2fa_codes');
  console.log('✅ Dropped email_2fa_codes table');
};
