/**
 * Live TOTP Code Generator
 * Continuously displays current valid code with countdown
 */

const speakeasy = require('speakeasy');

const secret = 'NE3HWOJFKB3CUY3LFI7VUMJYOE2WGMDBLZRFK3J6PJ5FWSKJONKA';

console.log('🔐 Live TOTP Generator for: uitest1762734925843@example.com');
console.log('=' .repeat(60));
console.log('\nPress Ctrl+C to stop\n');

function generateAndDisplay() {
  const now = Math.floor(Date.now() / 1000);
  const timeInWindow = now % 30;
  const secondsRemaining = 30 - timeInWindow;

  const code = speakeasy.totp({
    secret,
    encoding: 'base32'
  });

  // Clear console (Windows compatible)
  process.stdout.write('\r\x1b[K');

  // Display current code with countdown
  const bars = '█'.repeat(secondsRemaining) + '░'.repeat(30 - secondsRemaining);
  process.stdout.write(`  CODE: ${code}  |  Valid for: ${secondsRemaining}s  ${bars}`);
}

// Update every second
generateAndDisplay();
setInterval(generateAndDisplay, 1000);
