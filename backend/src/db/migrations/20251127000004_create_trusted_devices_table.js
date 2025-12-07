/**
 * Migration: Create trusted_devices table
 *
 * Purpose: Store trusted devices that can skip MFA verification
 * Allows users to mark devices as trusted for a configurable period
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.4)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('trusted_devices', (table) => {
    // Primary key
    table.increments('id').primary();

    // User reference
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // Device identification
    table.string('device_fingerprint', 255).notNullable();
    table.string('device_name', 100).nullable(); // User-friendly name (e.g., "Chrome on Windows")

    // Device metadata
    table.string('browser', 100).nullable();
    table.string('browser_version', 50).nullable();
    table.string('os', 100).nullable();
    table.string('os_version', 50).nullable();
    table.string('device_type', 50).nullable(); // desktop, mobile, tablet

    // Network information (for security logging)
    table.string('ip_address', 45).nullable(); // Supports IPv6
    table.string('location', 255).nullable(); // City, Country (if available)

    // Trust period
    table.timestamp('trusted_until').notNullable();

    // Last used tracking
    table.timestamp('last_used_at').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('device_fingerprint');
    table.index('trusted_until');
    table.unique(['user_id', 'device_fingerprint']); // One trust record per device per user
  });

  console.log('✅ Created trusted_devices table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('trusted_devices');
  console.log('✅ Dropped trusted_devices table');
};
