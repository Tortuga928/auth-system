/**
 * Test Email Routes (Development Only)
 *
 * Endpoints for testing email functionality in development
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * @route   POST /api/test-email/send
 * @desc    Send test email
 * @access  Public (development only)
 * @body    { to }
 */
router.post('/send', async (req, res, next) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (to) is required',
      });
    }

    const result = await emailService.sendTestEmail(to);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Test email error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/test-email/verification
 * @desc    Send test verification email
 * @access  Public (development only)
 * @body    { to, username, verificationUrl }
 */
router.post('/verification', async (req, res, next) => {
  try {
    const { to, username, verificationUrl } = req.body;

    if (!to || !username || !verificationUrl) {
      return res.status(400).json({
        success: false,
        message: 'to, username, and verificationUrl are required',
      });
    }

    const result = await emailService.sendVerificationEmail(to, username, verificationUrl);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Verification email error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/test-email/password-reset
 * @desc    Send test password reset email
 * @access  Public (development only)
 * @body    { to, username, resetUrl }
 */
router.post('/password-reset', async (req, res, next) => {
  try {
    const { to, username, resetUrl } = req.body;

    if (!to || !username || !resetUrl) {
      return res.status(400).json({
        success: false,
        message: 'to, username, and resetUrl are required',
      });
    }

    const result = await emailService.sendPasswordResetEmail(to, username, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Password reset email error:', error);
    next(error);
  }
});

module.exports = router;
