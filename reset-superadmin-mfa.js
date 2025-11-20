const { Pool } = require('pg');
const config = require('./backend/src/config');

const pool = new Pool({
  connectionString: config.database.url,
});

async function resetMFA() {
  try {
    // Delete MFA secret for testsuperadmin
    const result = await pool.query(
      'DELETE FROM mfa_secrets WHERE user_id = (SELECT id FROM users WHERE email = $1) RETURNING *',
      ['testsuperadmin@example.com']
    );
    
    console.log(`✅ Deleted ${result.rowCount} MFA secret(s) for testsuperadmin`);
    console.log('\nYou can now login with:');
    console.log('   Email: testsuperadmin@example.com');
    console.log('   Password: SuperAdmin123!@#');
    console.log('   MFA: DISABLED');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

resetMFA();
