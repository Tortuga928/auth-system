/**
 * Email Service
 *
 * Handles sending emails using Nodemailer with SMTP configuration.
 * Supports multiple SMTP providers (Gmail, SendGrid, etc.)
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || 'Auth System';

// Create transporter
let transporter = null;

/**
 * Initialize email transporter
 *
 * Creates nodemailer transporter with SMTP configuration.
 * If SMTP credentials are not configured, creates test account using Ethereal.
 *
 * @returns {Promise<Object>} Nodemailer transporter
 */
async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if SMTP credentials are configured
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('⚠️  SMTP credentials not configured. Using Ethereal test account...');

    // Create test account using ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('📧 Ethereal test account created:');
    console.log('   User:', testAccount.user);
    console.log('   Preview URLs will be logged for each email sent');
  } else {
    // Use configured SMTP
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('📧 Email service initialized with configured SMTP');
  }

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log('✅ Email service is ready to send emails');
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    throw new Error(`Failed to initialize email service: ${error.message}`);
  }

  return transporter;
}

/**
 * Send email
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result with messageId and info
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    // Validate required fields
    if (!to) {
      throw new Error('Recipient email (to) is required');
    }
    if (!subject) {
      throw new Error('Email subject is required');
    }
    if (!text && !html) {
      throw new Error('Email must have either text or html content');
    }

    // Get transporter
    const transport = await getTransporter();

    // Send email
    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    // Log success
    console.log('✅ Email sent successfully');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Message ID:', info.messageId);

    // If using Ethereal, log preview URL
    if (info.messageId && !EMAIL_CONFIG.auth.user) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('   Preview URL:', previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send verification email
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} verificationUrl - Verification link URL
 * @returns {Promise<Object>} Send result
 */
async function sendVerificationEmail(to, username, verificationUrl) {
  const subject = 'Verify Your Email Address';

  const text = `
Hello ${username},

Thank you for registering! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
Auth System Team
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to Auth System!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p class="footer">
            This link will expire in 24 hours.<br>
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send password reset email
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} resetUrl - Password reset link URL
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordResetEmail(to, username, resetUrl) {
  const subject = 'Reset Your Password';

  const text = `
Hello ${username},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Auth System Team
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
          }
          .button {
            display: inline-block;
            background-color: #dc3545;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
          <p class="footer">
            This link will expire in 1 hour.<br>
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send password reset confirmation email
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordResetConfirmationEmail(to, username) {
  const subject = 'Password Reset Successful';

  const text = `
Hello ${username},

Your password has been successfully reset.

If you did not make this change, please contact support immediately.

Best regards,
Auth System Team
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
          }
          .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Successful</h2>
          <p>Hello ${username},</p>
          <div class="success">
            ✅ Your password has been successfully reset.
          </div>
          <p>You can now log in with your new password.</p>
          <p class="footer">
            If you did not make this change, please contact support immediately.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Test email configuration
 *
 * Sends a test email to verify configuration
 *
 * @param {string} to - Test recipient email address
 * @returns {Promise<Object>} Send result
 */
async function sendTestEmail(to) {
  const subject = 'Test Email from Auth System';
  const text = 'This is a test email to verify your email configuration is working correctly.';
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Email Configuration Test</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, your SMTP settings are configured properly!</p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html });
}

module.exports = {
  getTransporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendTestEmail,
};
