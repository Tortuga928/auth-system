/**
 * Migration: Create mfa_role_config table
 *
 * Purpose: Store role-specific MFA configuration settings
 * Allows different MFA requirements per role (user, admin, super_admin)
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.2)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('mfa_role_config', (table) => {
    // Primary key
    table.increments('id').primary();

    // Role: user, admin, super_admin
    table.string('role', 20).notNullable().unique();

    // Whether MFA is required for this role
    table.boolean('mfa_required').notNullable().defaultTo(false);

    // Allowed MFA methods for this role (JSON array: ['totp', 'email'])
    table.json('allowed_methods').notNullable().defaultTo('["totp", "email"]');

    // Override system settings for this role (if null, use system defaults)
    table.integer('code_expiration_minutes').nullable();
    table.integer('max_failed_attempts').nullable();
    table.string('lockout_behavior', 30).nullable();
    table.integer('lockout_duration_minutes').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('role');
  });

  // Insert default configuration for each role
  await knex('mfa_role_config').insert([
    {
      role: 'user',
      mfa_required: false,
      allowed_methods: JSON.stringify(['totp', 'email']),
    },
    {
      role: 'admin',
      mfa_required: false,
      allowed_methods: JSON.stringify(['totp', 'email']),
    },
    {
      role: 'super_admin',
      mfa_required: false,
      allowed_methods: JSON.stringify(['totp', 'email']),
    },
  ]);

  console.log('✅ Created mfa_role_config table with default role configurations');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('mfa_role_config');
  console.log('✅ Dropped mfa_role_config table');
};
