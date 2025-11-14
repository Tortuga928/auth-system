/**
 * Migration: Enhance sessions table with metadata
 *
 * Story 9.1: Enhanced Session Tracking & Metadata
 * Adds columns for browser, OS, device type, location, and last activity tracking
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if columns already exist (idempotent migration)
  const hasLastActivity = await knex.schema.hasColumn('sessions', 'last_activity_at');

  if (hasLastActivity) {
    console.log('✓ Sessions table already has metadata columns, skipping');
    return;
  }

  return knex.schema.alterTable('sessions', (table) => {
    // Last activity tracking
    table.timestamp('last_activity_at').nullable();

    // Parsed user agent information
    table.string('browser', 100).nullable(); // e.g., "Chrome", "Safari", "Firefox"
    table.string('os', 100).nullable(); // e.g., "Windows 10", "macOS", "iOS 17"
    table.string('device_type', 50).nullable(); // "desktop", "mobile", "tablet"

    // Approximate location from IP address
    table.string('location', 255).nullable(); // e.g., "San Francisco, USA"

    // Add index for last_activity_at (used for cleanup and timeout checks)
    table.index('last_activity_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sessions', (table) => {
    table.dropColumn('last_activity_at');
    table.dropColumn('browser');
    table.dropColumn('os');
    table.dropColumn('device_type');
    table.dropColumn('location');
  });
};
