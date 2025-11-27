/**
 * Migration: Add archive columns to users table
 *
 * Adds archived_at and anonymized_at timestamps for:
 * - Archive feature (hide users from default view)
 * - GDPR compliance (track when PII was anonymized)
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    // Timestamp when user was archived (null = not archived)
    table.timestamp('archived_at').nullable().defaultTo(null);

    // Timestamp when user data was anonymized for GDPR (null = not anonymized)
    table.timestamp('anonymized_at').nullable().defaultTo(null);

    // Index for efficient filtering by archive status
    table.index('archived_at', 'idx_users_archived_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropIndex('archived_at', 'idx_users_archived_at');
    table.dropColumn('anonymized_at');
    table.dropColumn('archived_at');
  });
};
