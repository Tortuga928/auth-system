/**
 * Migration: Create oauth_accounts table
 *
 * Purpose: Store OAuth provider information for social login
 * Supports: Google, GitHub, and future OAuth providers
 *
 * This replaces the google_id and github_id columns from the users table
 * with a flexible many-to-one relationship allowing multiple OAuth accounts
 * per user.
 */

exports.up = function(knex) {
  return knex.schema.createTable('oauth_accounts', (table) => {
    // Primary key
    table.increments('id').primary();

    // Foreign key to users table
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    // OAuth provider information
    table.string('provider', 50).notNullable(); // 'google', 'github', etc.
    table.string('provider_user_id', 255).notNullable(); // Provider's user ID
    table.string('email', 255); // Email from provider (may differ from primary email)
    table.text('access_token'); // OAuth access token (optional storage)
    table.text('refresh_token'); // OAuth refresh token (optional storage)
    table.timestamp('token_expires_at'); // Token expiration

    // Metadata
    table.json('profile_data'); // Additional profile data from provider

    // Timestamps
    table.timestamps(true, true);

    // Constraints
    // Each provider account can only be linked once (no duplicate Google IDs, etc.)
    table.unique(['provider', 'provider_user_id']);

    // Indexes for fast lookups
    table.index('user_id');
    table.index(['provider', 'provider_user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('oauth_accounts');
};
