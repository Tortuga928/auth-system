/**
 * Migration: Create audit_logs table
 *
 * Tracks all admin actions for security and compliance
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    // Primary key
    table.increments('id').primary();

    // Admin who performed the action
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('admin_email', 255).notNullable();

    // Action details
    table.string('action', 100).notNullable(); // USER_CREATE, USER_UPDATE, etc.
    table.string('target_type', 50).notNullable(); // user, system, config
    table.integer('target_id').unsigned().nullable(); // NULL for system actions

    // Additional context
    table.jsonb('details').nullable(); // Changed fields, before/after values
    table.string('ip_address', 45).nullable(); // IPv4 or IPv6
    table.text('user_agent').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('admin_id');
    table.index('action');
    table.index('target_type');
    table.index('target_id');
    table.index('created_at');
    table.index(['admin_id', 'created_at']); // Composite index for admin history
  });

  console.log('✅ Created audit_logs table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  console.log('✅ Dropped audit_logs table');
};
