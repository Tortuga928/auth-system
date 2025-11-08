/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('oauth_providers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('provider').notNullable(); // 'google' or 'github'
    table.string('provider_user_id').notNullable(); // ID from OAuth provider
    table.string('provider_email').notNullable(); // Email from OAuth provider
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key to users table
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Unique constraint: one provider account can only link to one user
    table.unique(['provider', 'provider_user_id']);

    // Index for faster lookups
    table.index(['user_id']);
    table.index(['provider', 'provider_email']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('oauth_providers');
};
