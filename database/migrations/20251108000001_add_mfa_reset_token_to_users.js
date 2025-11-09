/**
 * Migration: Add MFA Reset Token fields to users table
 *
 * Adds mfa_reset_token and mfa_reset_token_expires columns
 * to support MFA recovery flow (Story 7.4)
 */

exports.up = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.string('mfa_reset_token', 64).nullable();
    table.timestamp('mfa_reset_token_expires').nullable();

    // Add index for faster lookups
    table.index('mfa_reset_token');
  });

  console.log('✅ Added mfa_reset_token columns to users table');
};

exports.down = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('mfa_reset_token');
    table.dropColumn('mfa_reset_token_expires');
  });

  console.log('✅ Removed mfa_reset_token columns from users table');
};
