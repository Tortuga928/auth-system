/**
 * Migration: Create mfa_secrets table
 *
 * Purpose: Store Multi-Factor Authentication secrets and backup codes
 * Supports: TOTP (Time-based One-Time Password) via apps like Google Authenticator
 *
 * This replaces the mfa_enabled, mfa_secret, and mfa_backup_codes columns
 * from the users table with a dedicated table for better security and separation.
 */

exports.up = function(knex) {
  return knex.schema.createTable('mfa_secrets', (table) => {
    // Primary key
    table.increments('id').primary();

    // One-to-one relationship with users
    table.integer('user_id').unsigned().notNullable().unique();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // MFA secret (encrypted at application level before storage)
    table.string('secret', 255).notNullable();

    // Backup codes (encrypted JSON array of one-time use codes)
    table.json('backup_codes').notNullable();

    // MFA status
    table.boolean('enabled').defaultTo(false);
    table.timestamp('enabled_at'); // When MFA was activated
    table.timestamp('last_used_at'); // Last successful MFA verification

    // Recovery information
    table.integer('failed_attempts').defaultTo(0);
    table.timestamp('locked_until'); // Temporary lock after too many failed attempts

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('user_id');
    table.index('enabled');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('mfa_secrets');
};
