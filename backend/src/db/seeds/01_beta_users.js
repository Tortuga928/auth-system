/**
 * Beta Environment Seed Data
 * Creates test users for beta testing environment
 *
 * NOTE: Only run this in beta environment!
 * These are test credentials with known passwords for testing purposes.
 */

const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

/**
 * Seed users for beta testing
 */
exports.seed = async function (knex) {
  // Only run in beta/development environments
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    console.log('⚠️  Skipping beta seeds in production environment');
    return;
  }

  console.log(`🌱 Seeding beta test users (${env} environment)...`);

  // Delete existing data (clean slate)
  await knex('mfa_secrets').del(); // Delete MFA secrets first (foreign key constraint)
  await knex('users').del();
  console.log('   Cleared existing users and MFA secrets');

  // Hash passwords (use lower rounds for faster seeding in test)
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin123!@#', saltRounds);
  const userPassword = await bcrypt.hash('User123!@#', saltRounds);
  const mfaPassword = await bcrypt.hash('MFA123!@#', saltRounds);

  // Generate MFA secret for mfa-enabled user
  const mfaSecret = speakeasy.generateSecret({ length: 32 });

  // Generate backup codes for MFA user (hashed)
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 15).toUpperCase();
    const hashedCode = await bcrypt.hash(code, saltRounds);
    backupCodes.push({
      code: hashedCode,
      used: false,
      created_at: new Date().toISOString(),
    });
  }

  // Insert test users
  const users = await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@test.com',
      password_hash: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      email_verified: true,
      role: 'admin',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      username: 'testuser',
      email: 'testuser@test.com',
      password_hash: userPassword,
      first_name: 'Test',
      last_name: 'User',
      email_verified: true,
      role: 'user',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      username: 'mfauser',
      email: 'mfa@test.com',
      password_hash: mfaPassword,
      first_name: 'MFA',
      last_name: 'User',
      email_verified: true,
      role: 'user',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]).returning('*');

  // Create MFA secret for the MFA user (in separate mfa_secrets table)
  const mfaUser = users.find(u => u.username === 'mfauser');
  if (mfaUser) {
    await knex('mfa_secrets').insert({
      user_id: mfaUser.id,
      secret: mfaSecret.base32,
      backup_codes: JSON.stringify(backupCodes),
      enabled: true,
      enabled_at: knex.fn.now(),
    });
    console.log('   Created MFA secret for mfauser');
  }

  console.log(`✅ Created ${users.length} test users\n`);
  console.log('================================================================================');
  console.log('🧪 BETA TEST CREDENTIALS');
  console.log('================================================================================\n');
  console.log('1️⃣  ADMIN USER:');
  console.log('   Email:    admin@test.com');
  console.log('   Password: Admin123!@#');
  console.log('   Role:     admin');
  console.log('   MFA:      Disabled\n');

  console.log('2️⃣  REGULAR USER:');
  console.log('   Email:    testuser@test.com');
  console.log('   Password: User123!@#');
  console.log('   Role:     user');
  console.log('   MFA:      Disabled\n');

  console.log('3️⃣  MFA-ENABLED USER:');
  console.log('   Email:    mfa@test.com');
  console.log('   Password: MFA123!@#');
  console.log('   Role:     user');
  console.log('   MFA:      ✅ Enabled');
  console.log('   Secret:   ' + mfaSecret.base32);
  console.log('   QR URL:   ' + mfaSecret.otpauth_url);
  console.log('   Note: Use this secret to set up authenticator app\n');

  console.log('================================================================================');
  console.log('📝 USAGE');
  console.log('================================================================================\n');
  console.log('• Login at: https://auth-frontend-beta.onrender.com/login');
  console.log('• Use any of the above credentials');
  console.log('• MFA user will prompt for TOTP code after password');
  console.log('• Generate TOTP codes using the secret above\n');

  console.log('================================================================================\n');
};
