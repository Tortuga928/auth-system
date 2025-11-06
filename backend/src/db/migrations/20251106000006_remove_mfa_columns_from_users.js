/**
 * Migration: Remove MFA columns from users table
 *
 * Purpose: Remove mfa_enabled, mfa_secret, and mfa_backup_codes from users table
 * These are now handled by the mfa_secrets table for better separation
 *
 * Note: This migration assumes no data exists yet. If migrating production
 * data, you would need a data migration step to move MFA data to the
 * mfa_secrets table before dropping these columns.
 */

exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('mfa_enabled');
    table.dropColumn('mfa_secret');
    table.dropColumn('mfa_backup_codes');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.boolean('mfa_enabled').defaultTo(false);
    table.string('mfa_secret', 255);
    table.json('mfa_backup_codes');
  });
};
