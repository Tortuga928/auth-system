/**
 * OAuthProvider Model
 *
 * Database operations for oauth_providers table
 */

const db = require('../db');

class OAuthProvider {
  /**
   * Create or update OAuth provider link
   *
   * @param {Object} data - OAuth provider data
   * @param {number} data.user_id - User ID
   * @param {string} data.provider - Provider name ('google' or 'github')
   * @param {string} data.provider_user_id - Provider's user ID
   * @param {string} data.provider_email - Provider's email
   * @returns {Promise<Object>} Created/updated OAuth provider record
   */
  static async upsert({ user_id, provider, provider_user_id, provider_email }) {
    const query = `
      INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (provider, provider_user_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        provider_email = EXCLUDED.provider_email,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [user_id, provider, provider_user_id, provider_email];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find OAuth provider by provider and provider_user_id
   *
   * @param {string} provider - Provider name ('google' or 'github')
   * @param {string} provider_user_id - Provider's user ID
   * @returns {Promise<Object|null>} OAuth provider record or null
   */
  static async findByProviderAndId(provider, provider_user_id) {
    const query = `
      SELECT * FROM oauth_providers
      WHERE provider = $1 AND provider_user_id = $2
    `;

    const result = await db.query(query, [provider, provider_user_id]);
    return result.rows[0] || null;
  }

  /**
   * Find all OAuth providers for a user
   *
   * @param {number} user_id - User ID
   * @returns {Promise<Array>} Array of OAuth provider records
   */
  static async findByUserId(user_id) {
    const query = `
      SELECT provider, provider_email, created_at
      FROM oauth_providers
      WHERE user_id = $1
      ORDER BY created_at ASC
    `;

    const result = await db.query(query, [user_id]);
    return result.rows;
  }

  /**
   * Check if a provider is linked to a user
   *
   * @param {number} user_id - User ID
   * @param {string} provider - Provider name ('google' or 'github')
   * @returns {Promise<boolean>} True if linked, false otherwise
   */
  static async isLinked(user_id, provider) {
    const query = `
      SELECT COUNT(*) as count
      FROM oauth_providers
      WHERE user_id = $1 AND provider = $2
    `;

    const result = await db.query(query, [user_id, provider]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Unlink OAuth provider from user
   *
   * @param {number} user_id - User ID
   * @param {string} provider - Provider name ('google' or 'github')
   * @returns {Promise<boolean>} True if unlinked, false if not found
   */
  static async unlink(user_id, provider) {
    const query = `
      DELETE FROM oauth_providers
      WHERE user_id = $1 AND provider = $2
      RETURNING *
    `;

    const result = await db.query(query, [user_id, provider]);
    return result.rows.length > 0;
  }

  /**
   * Delete all OAuth providers for a user
   *
   * @param {number} user_id - User ID
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteByUserId(user_id) {
    const query = `
      DELETE FROM oauth_providers
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [user_id]);
    return result.rows.length;
  }
}

module.exports = OAuthProvider;
