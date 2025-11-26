/**
 * Migration: Create system_settings table
 *
 * Stores application-wide configuration settings
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('system_settings', (table) => {
    // Primary key
    table.increments('id').primary();

    // Setting key (unique identifier)
    table.string('key', 100).notNullable().unique();

    // Setting value (JSON for flexibility)
    table.jsonb('value').notNullable();

    // Metadata
    table.string('description', 500).nullable();
    table.string('category', 50).notNullable().defaultTo('general');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('key');
    table.index('category');
  });

  // Insert default email verification settings
  await knex('system_settings').insert([
    {
      key: 'email_verification_enabled',
      value: JSON.stringify(false),
      description: 'Whether email verification is enabled for new registrations',
      category: 'email',
    },
    {
      key: 'email_verification_enforced',
      value: JSON.stringify(false),
      description: 'Whether email verification is enforced (blocks unverified users)',
      category: 'email',
    },
    {
      key: 'email_verification_grace_period_days',
      value: JSON.stringify(0),
      description: 'Days before unverified users are blocked (0 = immediate)',
      category: 'email',
    },
    {
      key: 'active_email_service_id',
      value: JSON.stringify(null),
      description: 'ID of the currently active email service configuration',
      category: 'email',
    },
  ]);

  console.log('✅ Created system_settings table with default values');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('system_settings');
  console.log('✅ Dropped system_settings table');
};
