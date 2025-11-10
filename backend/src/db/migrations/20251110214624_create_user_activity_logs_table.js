/**
 * Migration: Create user_activity_logs table
 *
 * Purpose: Track user actions for security and activity history
 * Used in: Dashboard Recent Activity, Activity Log page (Story 8.5)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_activity_logs', (table) => {
    // Primary key
    table.increments('id').primary();

    // User relationship
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // Activity details
    table.string('action', 100).notNullable(); // e.g., 'login', 'logout', 'password_changed'
    table.text('description'); // Human-readable description

    // Request metadata
    table.string('ip_address', 45); // IPv4 or IPv6
    table.text('user_agent'); // Browser/device info
    table.json('metadata'); // Additional contextual data

    // Timestamp
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('created_at');
    table.index(['user_id', 'created_at']); // Composite index for recent activity queries
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_activity_logs');
};
