/**
 * Email Test Service
 *
 * Provides branded test email functionality for verifying email delivery.
 * Includes diagnostic information for debugging email configuration.
 */

const emailService = require('./emailService');

/**
 * Generate branded HTML test email with diagnostic info
 *
 * @param {string} recipientEmail - Email address of recipient
 * @param {string} timestamp - ISO timestamp of when email was sent
 * @param {Object} diagnostics - Diagnostic information
 * @returns {string} HTML email content
 */
function generateTestEmailHTML(recipientEmail, timestamp, diagnostics) {
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            padding: 30px 20px;
          }
          .success-badge {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
          }
          .success-badge .checkmark {
            font-size: 24px;
            margin-right: 10px;
          }
          .diagnostic {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin-top: 25px;
          }
          .diagnostic h3 {
            margin-top: 0;
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .diagnostic-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
            font-size: 14px;
          }
          .diagnostic-item:last-child {
            border-bottom: none;
          }
          .diagnostic-item .label {
            color: #6c757d;
            font-weight: 500;
          }
          .diagnostic-item .value {
            color: #212529;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔐</div>
            <h1>Auth System</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Email Delivery Test</p>
          </div>

          <div class="content">
            <div class="success-badge">
              <span class="checkmark">✅</span>
              <strong>Email delivery is working correctly!</strong>
            </div>

            <p>This is a test email from your Auth System. If you're reading this message, your email configuration is set up correctly and emails are being delivered successfully.</p>

            <div class="diagnostic">
              <h3>📋 Diagnostic Information</h3>
              <div class="diagnostic-item">
                <span class="label">Recipient</span>
                <span class="value">${recipientEmail}</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">Sent At</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">SMTP Server</span>
                <span class="value">${diagnostics.smtpHost}:${diagnostics.smtpPort}</span>
              </div>
              <div class="diagnostic-item">
                <span class="label">From Address</span>
                <span class="value">${diagnostics.fromEmail}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated test email. No action is required.</p>
            <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
}

/**
 * Generate plain text version of test email
 *
 * @param {string} recipientEmail - Email address of recipient
 * @param {string} timestamp - ISO timestamp of when email was sent
 * @param {Object} diagnostics - Diagnostic information
 * @returns {string} Plain text email content
 */
function generateTestEmailText(recipientEmail, timestamp, diagnostics) {
  const formattedDate = new Date(timestamp).toLocaleString();

  return `
Auth System - Email Delivery Test
==================================

✅ Email delivery is working correctly!

This is a test email from your Auth System. If you're reading this message, your email configuration is set up correctly.

Diagnostic Information:
-----------------------
Recipient: ${recipientEmail}
Sent At: ${formattedDate}
SMTP Server: ${diagnostics.smtpHost}:${diagnostics.smtpPort}
From Address: ${diagnostics.fromEmail}

---
This is an automated test email. No action is required.
© ${new Date().getFullYear()} Auth System
  `.trim();
}

/**
 * Send branded test email with diagnostic information
 *
 * @param {string} recipientEmail - Email address to send test to
 * @returns {Promise<Object>} Result with success, messageId, timestamp
 */
async function sendBrandedTestEmail(recipientEmail) {
  const timestamp = new Date().toISOString();

  const diagnostics = {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '587',
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com',
  };

  const html = generateTestEmailHTML(recipientEmail, timestamp, diagnostics);
  const text = generateTestEmailText(recipientEmail, timestamp, diagnostics);

  const result = await emailService.sendEmail({
    to: recipientEmail,
    subject: '🔐 Auth System - Email Delivery Test',
    text,
    html,
  });

  return {
    success: true,
    messageId: result.messageId,
    timestamp,
    recipient: recipientEmail,
  };
}

module.exports = {
  sendBrandedTestEmail,
  generateTestEmailHTML,
  generateTestEmailText,
};
