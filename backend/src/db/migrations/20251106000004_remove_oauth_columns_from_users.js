/**
 * Migration: Remove OAuth columns from users table
 *
 * Purpose: Remove google_id and github_id columns from users table
 * These are now handled by the oauth_accounts table for better flexibility
 *
 * Note: This migration assumes no data exists yet. If migrating production
 * data, you would need a data migration step to move OAuth IDs to the
 * oauth_accounts table before dropping these columns.
 */

exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('google_id');
    table.dropColumn('github_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.string('google_id', 100);
    table.string('github_id', 100);

    // Re-add indexes
    table.index('google_id');
    table.index('github_id');
  });
};
