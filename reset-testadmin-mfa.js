/**
 * Reset testadmin MFA settings
 * Disables MFA for testadmin@example.com
 */

const { Pool } = require('pg');
const config = require('./backend/src/config');

// Create database connection
const pool = new Pool({
  connectionString: config.database.url,
});

async function resetTestAdminMFA() {
  console.log('🔧 Resetting testadmin MFA settings...\n');

  try {
    // Find testadmin user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['testadmin@example.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ testadmin@example.com not found');
      await cleanup();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Current MFA status (users table): ${user.mfa_enabled ? 'ENABLED' : 'DISABLED'}\n`);

    // Disable MFA - Delete from mfa_secrets table (this is the critical step)
    const deleteResult = await pool.query(
      'DELETE FROM mfa_secrets WHERE user_id = $1 RETURNING *',
      [user.id]
    );

    if (deleteResult.rowCount > 0) {
      console.log(`✅ Deleted ${deleteResult.rowCount} MFA secret(s) from mfa_secrets table`);
      console.log('✅ MFA completely disabled for testadmin@example.com');
    } else {
      console.log('ℹ️  No MFA secrets found - MFA was already disabled');
    }

    console.log('\nUser can now login with:');
    console.log('   Email: testadmin@example.com');
    console.log('   Password: Admin123!@#');
    console.log('   MFA: DISABLED\n');

    // Verify the change
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM mfa_secrets WHERE user_id = $1',
      [user.id]
    );

    console.log('Verification:');
    console.log(`   MFA secrets in database: ${verifyResult.rows[0].count}`);
    console.log(`   Expected: 0\n`);

    if (verifyResult.rows[0].count === '0') {
      console.log('✅ Reset complete! MFA fully disabled.');
    } else {
      console.log('⚠️  Warning: MFA secrets still exist in database');
    }

  } catch (error) {
    console.error('❌ Error resetting MFA:', error.message);
    console.error(error);
  } finally {
    await cleanup();
  }
}

async function cleanup() {
  try {
    await pool.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('Warning: Error closing database:', error.message);
  }
}

// Run the script
resetTestAdminMFA();
