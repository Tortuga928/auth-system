/**
 * Migration: Add MFA Enforcement Support
 *
 * Adds columns to support mandatory MFA setup enforcement:
 * - mfa_config: enforcement settings (enabled, grace period)
 * - users: individual user enforcement tracking
 * - mfa_role_config: role-based exemptions
 */

exports.up = async function(knex) {
  // Add enforcement columns to mfa_config table
  await knex.schema.alterTable('mfa_config', (table) => {
    table.boolean('mfa_enforcement_enabled').defaultTo(false);
    table.integer('enforcement_grace_period_days').defaultTo(14);
    table.timestamp('enforcement_started_at').nullable();
  });

  // Add enforcement tracking columns to users table
  await knex.schema.alterTable('users', (table) => {
    table.boolean('mfa_setup_required').defaultTo(false);
    table.timestamp('mfa_grace_period_start').nullable();
    table.timestamp('mfa_grace_period_end').nullable();
    table.boolean('mfa_setup_completed').defaultTo(false);
    table.timestamp('mfa_setup_completed_at').nullable();
  });

  // Add exemption column to mfa_role_config table
  await knex.schema.alterTable('mfa_role_config', (table) => {
    table.boolean('exempt_from_mfa').defaultTo(false);
  });

  console.log('✅ MFA enforcement columns added successfully');
};

exports.down = async function(knex) {
  // Remove enforcement columns from mfa_config table
  await knex.schema.alterTable('mfa_config', (table) => {
    table.dropColumn('mfa_enforcement_enabled');
    table.dropColumn('enforcement_grace_period_days');
    table.dropColumn('enforcement_started_at');
  });

  // Remove enforcement tracking columns from users table
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('mfa_setup_required');
    table.dropColumn('mfa_grace_period_start');
    table.dropColumn('mfa_grace_period_end');
    table.dropColumn('mfa_setup_completed');
    table.dropColumn('mfa_setup_completed_at');
  });

  // Remove exemption column from mfa_role_config table
  await knex.schema.alterTable('mfa_role_config', (table) => {
    table.dropColumn('exempt_from_mfa');
  });

  console.log('✅ MFA enforcement columns removed successfully');
};
