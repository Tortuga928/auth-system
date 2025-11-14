/**
 * Migration: Add session timeout fields
 *
 * Story 9.4: Session Timeout & "Remember Me"
 * Adds remember_me and absolute_expires_at fields to sessions table
 */

exports.up = function(knex) {
  return knex.schema.table('sessions', (table) => {
    // Remember me flag - extends session duration
    table.boolean('remember_me').defaultTo(false);

    // Absolute expiration timestamp - session expires after this time regardless of activity
    // Prevents indefinite sessions even with continuous activity
    table.timestamp('absolute_expires_at').nullable();

    // Add index for cleanup queries
    table.index('absolute_expires_at', 'idx_sessions_absolute_expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('sessions', (table) => {
    table.dropIndex('absolute_expires_at', 'idx_sessions_absolute_expires_at');
    table.dropColumn('absolute_expires_at');
    table.dropColumn('remember_me');
  });
};
