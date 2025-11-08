/**
 * Linked Providers Routes
 *
 * Routes for managing OAuth provider links
 */

const express = require('express');
const router = express.Router();
const OAuthProvider = require('../models/OAuthProvider');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/auth/linked-providers
 * @desc    Get list of linked OAuth providers for current user
 * @access  Private
 */
router.get('/linked-providers', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const linkedProviders = await OAuthProvider.findByUserId(userId);

    res.json({
      success: true,
      message: 'Linked providers retrieved',
      data: {
        linkedProviders: linkedProviders.map((p) => ({
          provider: p.provider,
          provider_email: p.provider_email,
          linked_at: p.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Get linked providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve linked providers',
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/auth/unlink/:provider
 * @desc    Unlink OAuth provider from current user
 * @access  Private
 */
router.delete('/unlink/:provider', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;

    // Validate provider
    if (!['google', 'github'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "google" or "github"',
      });
    }

    // Check if provider is linked
    const isLinked = await OAuthProvider.isLinked(userId, provider);

    if (!isLinked) {
      return res.status(404).json({
        success: false,
        error: `${provider} is not linked to this account`,
      });
    }

    // Unlink the provider
    await OAuthProvider.unlink(userId, provider);

    console.log(`✅ Unlinked ${provider} from user ${userId}`);

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`,
    });
  } catch (error) {
    console.error('❌ Unlink provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink provider',
      details: error.message,
    });
  }
});

module.exports = router;
