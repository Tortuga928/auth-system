/**
 * Create a test user for dashboard testing
 * No MFA, email verified
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createTestUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'authdb',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // User details
    const username = 'testdashboard';
    const email = 'testdashboard@example.com';
    const password = 'Test123!@#';

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
    const checkResult = await client.query(checkQuery, [email, username]);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  User already exists, deleting...');
      const deleteQuery = 'DELETE FROM users WHERE email = $1 OR username = $2';
      await client.query(deleteQuery, [email, username]);
      console.log('✅ Old user deleted');
    }

    // Create new user
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, role, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, email_verified, created_at
    `;

    const result = await client.query(insertQuery, [
      username,
      email,
      password_hash,
      'user',
      true // Email verified
    ]);

    const user = result.rows[0];

    console.log('\n✅ Test user created successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Username:  ${username}`);
    console.log(`   Email:     ${email}`);
    console.log(`   Password:  ${password}`);
    console.log(`   Role:      ${user.role}`);
    console.log(`   MFA:       Disabled (not set up)`);
    console.log(`   Verified:  ${user.email_verified ? 'Yes' : 'No'}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('🔗 Login at: http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
