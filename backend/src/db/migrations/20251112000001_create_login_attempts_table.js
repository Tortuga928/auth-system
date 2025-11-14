/**
 * Migration: Create login_attempts table
 *
 * Story 9.3: Login History & Security Events
 *
 * This table tracks all login attempts (successful and failed) with device
 * and location information for security monitoring.
 */

exports.up = function(knex) {
  return knex.schema.createTable('login_attempts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('CASCADE')
      .comment('User ID if login was successful, NULL if user not found');
    table.string('email', 255).notNullable()
      .comment('Email attempted (even if user doesn\'t exist)');
    table.boolean('success').notNullable()
      .comment('Whether login was successful');
    table.string('failure_reason', 255).nullable()
      .comment('Reason for failure: invalid_password, user_not_found, mfa_failed, account_locked');
    table.string('ip_address', 45).nullable()
      .comment('IP address of the attempt');
    table.string('user_agent', 500).nullable()
      .comment('User agent string');
    table.string('browser', 100).nullable()
      .comment('Parsed browser name and version');
    table.string('os', 100).nullable()
      .comment('Parsed operating system');
    table.string('device_type', 50).nullable()
      .comment('Device type: desktop, mobile, tablet');
    table.string('location', 255).nullable()
      .comment('Approximate location from IP geolocation');
    table.timestamp('attempted_at').defaultTo(knex.fn.now())
      .comment('When the login attempt occurred');

    // Indexes for efficient querying
    table.index('user_id', 'idx_login_attempts_user_id');
    table.index('email', 'idx_login_attempts_email');
    table.index('attempted_at', 'idx_login_attempts_attempted_at');
    table.index(['email', 'success', 'attempted_at'], 'idx_login_attempts_email_success_time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('login_attempts');
};
