/**
 * Migration: Create settings_audit_log table
 *
 * Tracks all settings configuration changes for audit purposes
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('settings_audit_log', (table) => {
    // Primary key
    table.increments('id').primary();

    // Admin who performed the action
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('admin_email', 255).notNullable();

    // Setting type: email_service, system_setting
    table.string('setting_type', 50).notNullable();

    // Action: create, update, delete, activate, deactivate, test_connection, test_send
    table.string('action', 50).notNullable();

    // Target ID (email_service id or null for system settings)
    table.integer('target_id').unsigned().nullable();

    // Setting key (for system_settings changes)
    table.string('setting_key', 100).nullable();

    // Before and after values (JSON, credentials are redacted)
    table.jsonb('old_value').nullable();
    table.jsonb('new_value').nullable();

    // Request context
    table.string('ip_address', 45).nullable(); // IPv4 or IPv6
    table.text('user_agent').nullable();

    // Result (for test actions)
    table.string('result_status', 20).nullable(); // success, failed
    table.text('result_message').nullable();

    // Timestamp (immutable - no updated_at)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('admin_id');
    table.index('setting_type');
    table.index('action');
    table.index('target_id');
    table.index('setting_key');
    table.index('created_at');
    table.index(['admin_id', 'created_at']); // Composite for admin history
    table.index(['setting_type', 'created_at']); // Composite for type history
  });

  console.log('✅ Created settings_audit_log table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('settings_audit_log');
  console.log('✅ Dropped settings_audit_log table');
};
