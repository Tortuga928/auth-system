/**
 * Migration: Create users table
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    // Primary key
    table.increments('id').primary();

    // Basic info
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();

    // Profile
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('avatar_url', 255);

    // Email verification
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token', 255);
    table.timestamp('email_verification_expires');

    // Password reset
    table.string('password_reset_token', 255);
    table.timestamp('password_reset_expires');

    // OAuth
    table.string('google_id', 100);
    table.string('github_id', 100);

    // MFA
    table.boolean('mfa_enabled').defaultTo(false);
    table.string('mfa_secret', 255);
    table.json('mfa_backup_codes');

    // Account status
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('email');
    table.index('username');
    table.index('google_id');
    table.index('github_id');
    table.index('email_verification_token');
    table.index('password_reset_token');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
