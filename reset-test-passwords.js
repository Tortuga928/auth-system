const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'authdb',
  user: 'postgres',
  password: 'postgres'
});

async function resetPasswords() {
  try {
    const password = 'Test123!';
    const hash = await bcrypt.hash(password, 10);

    const emails = ['testadmin@example.com', 'testsuperadmin@example.com', 'testuser@example.com'];

    // Update all test users
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = ANY($2) RETURNING email`,
      [hash, emails]
    );

    console.log('Passwords reset for:', result.rows.map(r => r.email).join(', '));
    console.log('New password: Test123!');

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

resetPasswords();
