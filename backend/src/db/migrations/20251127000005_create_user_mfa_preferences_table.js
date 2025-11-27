/**
 * Migration: Create user_mfa_preferences table
 *
 * Purpose: Store user-specific MFA preferences and alternate email
 * Allows users to choose preferred method and configure alternate email for 2FA
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.5)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('user_mfa_preferences', (table) => {
    // Primary key
    table.increments('id').primary();

    // User reference (one-to-one)
    table.integer('user_id').unsigned().notNullable().unique();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // Preferred MFA method: totp, email (used when both are available)
    table.string('preferred_method', 20).nullable();

    // Email 2FA enabled flag
    table.boolean('email_2fa_enabled').notNullable().defaultTo(false);
    table.timestamp('email_2fa_enabled_at').nullable();

    // Alternate email for 2FA (optional)
    table.string('alternate_email', 255).nullable();
    table.boolean('alternate_email_verified').notNullable().defaultTo(false);
    table.string('alternate_email_verification_token', 255).nullable();
    table.timestamp('alternate_email_verification_expires').nullable();

    // Transition tracking (for grace period method changes)
    table.string('pending_method_change', 20).nullable(); // What method they need to set up
    table.timestamp('method_change_deadline').nullable(); // When they must complete setup
    table.boolean('grandfathered').notNullable().defaultTo(false); // If they're exempt from new requirements

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('alternate_email');
    table.index('alternate_email_verification_token');
  });

  console.log('✅ Created user_mfa_preferences table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_mfa_preferences');
  console.log('✅ Dropped user_mfa_preferences table');
};
