/**
 * Migration: Add MFA reset token columns to users table
 *
 * Purpose: Add columns for MFA reset functionality
 * - mfa_reset_token: Secure token for resetting MFA
 * - mfa_reset_token_expires: Expiration timestamp for the token
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.string('mfa_reset_token', 255);
    table.timestamp('mfa_reset_token_expires');

    // Add index for faster lookups
    table.index('mfa_reset_token');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropIndex('mfa_reset_token');
    table.dropColumn('mfa_reset_token');
    table.dropColumn('mfa_reset_token_expires');
  });
};
