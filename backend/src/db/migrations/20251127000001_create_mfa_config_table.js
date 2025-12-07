/**
 * Migration: Create mfa_config table
 *
 * Purpose: Store system-wide MFA configuration settings
 * Supports: Multiple MFA modes (TOTP, Email, Combined), admin-configurable settings
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.1)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('mfa_config', (table) => {
    // Primary key
    table.increments('id').primary();

    // MFA Mode: disabled, totp_only, email_only, totp_email_required, totp_email_fallback
    table.string('mfa_mode', 30).notNullable().defaultTo('disabled');

    // Code settings
    table.integer('code_expiration_minutes').notNullable().defaultTo(5);
    table.integer('max_failed_attempts').notNullable().defaultTo(5);

    // Lockout behavior: temporary_lockout, require_password, admin_intervention
    table.string('lockout_behavior', 30).notNullable().defaultTo('temporary_lockout');
    table.integer('lockout_duration_minutes').notNullable().defaultTo(15);

    // Resend settings
    table.integer('resend_rate_limit').notNullable().defaultTo(3);
    table.integer('resend_cooldown_seconds').notNullable().defaultTo(60);

    // Code format: numeric_6, numeric_8, alphanumeric_6
    table.string('code_format', 20).notNullable().defaultTo('numeric_6');

    // Fallback settings (for totp_email_fallback mode)
    table.integer('fallback_totp_attempts_threshold').notNullable().defaultTo(3);

    // Backup codes settings
    table.boolean('backup_codes_enabled_totp').notNullable().defaultTo(true);
    table.boolean('backup_codes_enabled_email').notNullable().defaultTo(false);

    // Email verification requirement for Email 2FA
    table.boolean('email_verification_required').notNullable().defaultTo(true);

    // User control mode: user_managed, admin_controlled
    table.string('user_control_mode', 20).notNullable().defaultTo('user_managed');

    // Method change behavior: immediate, grace_period, grandfathered
    table.string('method_change_behavior', 20).notNullable().defaultTo('immediate');
    table.integer('grace_period_days').notNullable().defaultTo(7);

    // Role-based MFA
    table.boolean('role_based_mfa_enabled').notNullable().defaultTo(false);

    // Trusted device settings
    table.boolean('device_trust_enabled').notNullable().defaultTo(false);
    table.integer('device_trust_duration_days').notNullable().defaultTo(30);
    table.integer('max_trusted_devices').notNullable().defaultTo(5);

    // Test mode for setup wizard: mandatory, optional, disabled
    table.string('test_mode', 15).notNullable().defaultTo('optional');

    // Logging level: comprehensive, security_only, none
    table.string('logging_level', 20).notNullable().defaultTo('comprehensive');

    // Notification level: security_events, all_changes, none
    table.string('notification_level', 20).notNullable().defaultTo('security_events');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Insert default configuration (MFA disabled by default)
  await knex('mfa_config').insert({
    mfa_mode: 'disabled',
    code_expiration_minutes: 5,
    max_failed_attempts: 5,
    lockout_behavior: 'temporary_lockout',
    lockout_duration_minutes: 15,
    resend_rate_limit: 3,
    resend_cooldown_seconds: 60,
    code_format: 'numeric_6',
    fallback_totp_attempts_threshold: 3,
    backup_codes_enabled_totp: true,
    backup_codes_enabled_email: false,
    email_verification_required: true,
    user_control_mode: 'user_managed',
    method_change_behavior: 'immediate',
    grace_period_days: 7,
    role_based_mfa_enabled: false,
    device_trust_enabled: false,
    device_trust_duration_days: 30,
    max_trusted_devices: 5,
    test_mode: 'optional',
    logging_level: 'comprehensive',
    notification_level: 'security_events',
  });

  console.log('✅ Created mfa_config table with default configuration');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('mfa_config');
  console.log('✅ Dropped mfa_config table');
};
