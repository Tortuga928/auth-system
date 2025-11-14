/**
 * Manual UI Testing Script for Story 9.2
 *
 * This script simulates what a UI would do:
 * 1. Login from multiple devices
 * 2. Display all sessions in a user-friendly format
 * 3. Interactively revoke sessions
 *
 * Run: node test-story-9.2-manual-ui.js
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5000';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Format date to be more readable
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Display sessions in a nice table format
function displaySessions(sessions) {
  console.log('\n' + '═'.repeat(100));
  console.log('YOUR ACTIVE DEVICES');
  console.log('═'.repeat(100));

  if (sessions.length === 0) {
    console.log('No active sessions found.');
    return;
  }

  sessions.forEach((session, index) => {
    const icon = session.device_type === 'mobile' ? '📱' :
                 session.device_type === 'tablet' ? '📱' : '💻';
    const badge = session.is_current ? ' [CURRENT DEVICE]' : '';

    console.log(`\n${index + 1}. ${icon} ${session.device_name}${badge}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Browser:    ${session.browser} on ${session.os}`);
    console.log(`   Location:   ${session.location}`);
    console.log(`   IP Address: ${session.ip_address}`);
    console.log(`   Last Active: ${formatDate(session.last_activity_at)}`);
    console.log(`   Created:    ${formatDate(session.created_at)}`);
  });

  console.log('\n' + '═'.repeat(100));
}

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Story 9.2: Device Management - Manual UI Test          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Login
    const email = await question('Enter your email: ');
    const password = await question('Enter your password: ');

    console.log('\n🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });

    if (loginResponse.data.data.mfaRequired) {
      console.log('⚠️  MFA is enabled. Please use an account without MFA for this test.');
      rl.close();
      return;
    }

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    const authHeaders = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Main menu loop
    let running = true;
    while (running) {
      // Fetch and display sessions
      const sessionsResponse = await axios.get(`${API_URL}/api/sessions`, authHeaders);
      const sessions = sessionsResponse.data.data.sessions;

      displaySessions(sessions);

      console.log('\nWhat would you like to do?');
      console.log('1. Refresh session list');
      console.log('2. Revoke a specific session');
      console.log('3. Log out everywhere else');
      console.log('4. Exit');

      const choice = await question('\nYour choice (1-4): ');

      switch (choice.trim()) {
        case '1':
          console.log('\n🔄 Refreshing...');
          break;

        case '2':
          const sessionId = await question('\nEnter session ID to revoke: ');
          try {
            await axios.delete(`${API_URL}/api/sessions/${sessionId}`, authHeaders);
            console.log('✅ Session revoked successfully!');
          } catch (error) {
            console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
          }
          await question('\nPress Enter to continue...');
          break;

        case '3':
          const confirm = await question('\n⚠️  This will log you out from all other devices. Continue? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            try {
              const revokeResponse = await axios.post(`${API_URL}/api/sessions/revoke-others`, {}, authHeaders);
              const count = revokeResponse.data.data.revokedCount;
              console.log(`✅ Successfully logged out from ${count} other device${count !== 1 ? 's' : ''}!`);
            } catch (error) {
              console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
            }
          } else {
            console.log('Cancelled.');
          }
          await question('\nPress Enter to continue...');
          break;

        case '4':
          console.log('\n👋 Goodbye!\n');
          running = false;
          break;

        default:
          console.log('\n⚠️  Invalid choice. Please try again.');
          await question('Press Enter to continue...');
      }
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    rl.close();
  }
}

main();
