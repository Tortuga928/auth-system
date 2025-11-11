/**
 * Migration: Add avatar_url column to users table
 *
 * Purpose: Store user avatar/profile picture URL
 * Used in: Story 8.2 - Avatar Upload & Management
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if column already exists (idempotent migration)
  const hasColumn = await knex.schema.hasColumn('users', 'avatar_url');
  if (hasColumn) {
    console.log('✓ avatar_url column already exists in users table, skipping');
    return;
  }

  return knex.schema.alterTable('users', (table) => {
    table.string('avatar_url', 255).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('avatar_url');
  });
};
