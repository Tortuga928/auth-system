/**
 * Migration: Add super_admin role to users role enum
 *
 * Adds 'super_admin' as a new value to the existing role CHECK constraint
 */

exports.up = async function(knex) {
  // Drop existing CHECK constraint
  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  `);

  // Add new CHECK constraint with super_admin
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'super_admin'::text]));
  `);
};

exports.down = async function(knex) {
  // Drop the expanded CHECK constraint
  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  `);

  // Restore original CHECK constraint without super_admin
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));
  `);

  // Update any users with super_admin role back to admin
  await knex.raw(`
    UPDATE users SET role = 'admin' WHERE role = 'super_admin';
  `);
};
