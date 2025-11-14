/**
 * Migration: Create security_events table
 *
 * Story 9.3: Login History & Security Events
 *
 * This table stores security alerts and suspicious activity events for
 * user notification and audit purposes.
 */

exports.up = function(knex) {
  return knex.schema.createTable('security_events', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE')
      .comment('User affected by this security event');
    table.string('event_type', 100).notNullable()
      .comment('Type of event: login_from_new_location, brute_force_attempt, new_device_login, password_changed, mfa_disabled, etc.');
    table.text('description').nullable()
      .comment('Human-readable description of the event');
    table.string('severity', 20).defaultTo('info')
      .comment('Severity level: info, warning, critical');
    table.json('metadata').nullable()
      .comment('Additional event data as JSON');
    table.string('ip_address', 45).nullable()
      .comment('IP address associated with the event');
    table.timestamp('created_at').defaultTo(knex.fn.now())
      .comment('When the event occurred');
    table.boolean('acknowledged').defaultTo(false)
      .comment('Whether user has acknowledged/dismissed this alert');
    table.timestamp('acknowledged_at').nullable()
      .comment('When the user acknowledged the event');

    // Indexes for efficient querying
    table.index('user_id', 'idx_security_events_user_id');
    table.index('event_type', 'idx_security_events_event_type');
    table.index('severity', 'idx_security_events_severity');
    table.index('created_at', 'idx_security_events_created_at');
    table.index(['user_id', 'acknowledged', 'created_at'], 'idx_security_events_user_unack');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('security_events');
};
