/**
 * Rate Limiting Test
 * Tests that rate limiting is working correctly for registration endpoint
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

async function testRateLimiting() {
  console.log('🧪 RATE LIMITING TEST');
  console.log('='.repeat(70));
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  console.log('Testing Registration Rate Limit (5 per hour)');
  console.log('-'.repeat(70));
  console.log('Attempting 6 registration requests...\n');

  let rateLimitHit = false;
  let successCount = 0;
  let rateLimitResponse = null;

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: `ratelimit_test_${timestamp}_${i}`,
        email: `ratelimit_test_${timestamp}_${i}@test.com`,
        password: 'RateLimit123!@#',
      });

      successCount++;
      console.log(`✅ Request ${i}: SUCCESS (Status ${response.status})`);
      console.log(`   Response: ${response.data.message || 'Registration successful'}`);

    } catch (err) {
      if (err.response?.status === 429) {
        rateLimitHit = true;
        rateLimitResponse = err.response.data;
        console.log(`\n🚫 Request ${i}: RATE LIMIT HIT (Status 429)`);
        console.log(`   Message: ${err.response.data.message || err.response.data.error}`);
        console.log(`   Retry After: ${err.response.data.retryAfter} seconds`);

        // Check for rate limit headers
        if (err.response.headers['ratelimit-limit']) {
          console.log(`\n📊 Rate Limit Headers:`);
          console.log(`   Limit: ${err.response.headers['ratelimit-limit']}`);
          console.log(`   Remaining: ${err.response.headers['ratelimit-remaining']}`);
          console.log(`   Reset: ${err.response.headers['ratelimit-reset']}`);
        }

        break;
      } else {
        console.log(`❌ Request ${i}: ERROR (Status ${err.response?.status || 'unknown'})`);
        console.log(`   Error: ${err.response?.data?.error || err.message}`);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Successful Requests: ${successCount}/6`);
  console.log(`Rate Limit Hit: ${rateLimitHit ? 'YES ✅' : 'NO ❌'}`);

  if (rateLimitHit) {
    console.log(`\n✅ PASS: Rate limiting is working correctly!`);
    console.log(`   • First ${successCount} requests succeeded`);
    console.log(`   • Request ${successCount + 1} was blocked with 429 status`);
    console.log(`   • Expected limit: 5 per hour`);
    console.log(`   • Actual behavior: Blocked after ${successCount} requests`);

    if (rateLimitResponse) {
      console.log(`\n📝 Rate Limit Response:`);
      console.log(`   Error: ${rateLimitResponse.error}`);
      console.log(`   Message: ${rateLimitResponse.message}`);
      console.log(`   Retry After: ${rateLimitResponse.retryAfter} seconds (${Math.floor(rateLimitResponse.retryAfter / 60)} minutes)`);
    }
  } else {
    console.log(`\n❌ FAIL: Rate limiting is NOT working!`);
    console.log(`   • All 6 requests succeeded (expected: 5 max)`);
    console.log(`   • No 429 status received`);
    console.log(`   • Rate limiting may not be properly configured`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  return rateLimitHit;
}

// Run the test
testRateLimiting().then(passed => {
  process.exit(passed ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
