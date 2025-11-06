/**
 * Migration: Create sessions table
 */

exports.up = function(knex) {
  return knex.schema.createTable('sessions', (table) => {
    // Primary key
    table.increments('id').primary();

    // Foreign key to users
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // Session info
    table.string('refresh_token', 500).notNullable().unique();
    table.timestamp('expires_at').notNullable();

    // Device tracking
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.string('device_name', 255);

    // Status
    table.boolean('is_active').defaultTo(true);

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('user_id');
    table.index('refresh_token');
    table.index('expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sessions');
};
