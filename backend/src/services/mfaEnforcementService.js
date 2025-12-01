/**
 * MFA Enforcement Service
 *
 * Handles MFA setup enforcement logic including:
 * - Checking enforcement status for users
 * - Managing grace periods
 * - Role-based exemptions
 * - Applying grace periods to existing users
 */

const db = require('../db');
const MFAConfig = require('../models/MFAConfig');
const MFASecret = require('../models/MFASecret');
const UserMFAPreferences = require('../models/UserMFAPreferences');

/**
 * Check if a role is exempt from MFA enforcement
 */
const isRoleExempt = async (role) => {
  try {
    const query = 'SELECT exempt_from_mfa FROM mfa_role_config WHERE role = $1 LIMIT 1';
    const result = await db.query(query, [role]);
    return result.rows.length > 0 ? result.rows[0].exempt_from_mfa : false;
  } catch (error) {
    console.error('Error checking role exemption:', error);
    return false;
  }
};

/**
 * Check if user has MFA configured based on system mode
 */
const checkUserMFAConfiguration = async (userId, mfaMode) => {
  const mfaSecret = await MFASecret.findByUserId(userId);
  const hasTotpEnabled = mfaSecret && mfaSecret.enabled;

  const userPrefs = await UserMFAPreferences.getByUserId(userId);
  const hasEmail2FAEnabled = userPrefs?.email_2fa_enabled || false;

  let isFullyConfigured = false;
  let requiredMethods = [];
  let configuredMethods = [];
  let pendingMethods = [];

  switch (mfaMode) {
    case 'disabled':
      isFullyConfigured = true;
      break;
    case 'totp_only':
      requiredMethods = ['totp'];
      if (hasTotpEnabled) { configuredMethods.push('totp'); isFullyConfigured = true; }
      else { pendingMethods.push('totp'); }
      break;
    case 'email_only':
      requiredMethods = ['email'];
      if (hasEmail2FAEnabled) { configuredMethods.push('email'); isFullyConfigured = true; }
      else { pendingMethods.push('email'); }
      break;
    case 'totp_email_required':
      requiredMethods = ['totp', 'email'];
      if (hasTotpEnabled) configuredMethods.push('totp'); else pendingMethods.push('totp');
      if (hasEmail2FAEnabled) configuredMethods.push('email'); else pendingMethods.push('email');
      isFullyConfigured = hasTotpEnabled && hasEmail2FAEnabled;
      break;
    case 'totp_email_fallback':
      requiredMethods = ['totp'];
      if (hasTotpEnabled) { configuredMethods.push('totp'); isFullyConfigured = true; }
      else { pendingMethods.push('totp'); }
      if (hasEmail2FAEnabled) { configuredMethods.push('email'); }
      break;
    default:
      isFullyConfigured = true;
  }

  return { isFullyConfigured, hasTotpEnabled, hasEmail2FAEnabled, requiredMethods, configuredMethods, pendingMethods, mfaMode };
};

const calculateGracePeriodEnd = (startDate, gracePeriodDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + gracePeriodDays);
  return endDate;
};

const checkGracePeriodStatus = (user) => {
  if (!user.mfa_grace_period_end) {
    return { hasGracePeriod: false, isWithinGracePeriod: false, isExpired: false, daysRemaining: 0 };
  }
  const now = new Date();
  const gracePeriodEnd = new Date(user.mfa_grace_period_end);
  const isWithinGracePeriod = now < gracePeriodEnd;
  const msRemaining = gracePeriodEnd - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  return { hasGracePeriod: true, isWithinGracePeriod, isExpired: !isWithinGracePeriod, daysRemaining, gracePeriodEnd };
};

const getEnforcementStatus = async (user) => {
  const mfaConfig = await MFAConfig.get();

  if (mfaConfig.mfa_mode === 'disabled') {
    return { enforcementEnabled: false, mfaRequired: false, reason: 'MFA is disabled system-wide' };
  }

  if (!mfaConfig.mfa_enforcement_enabled) {
    return { enforcementEnabled: false, mfaRequired: false, reason: 'MFA enforcement is not enabled' };
  }

  const isExempt = await isRoleExempt(user.role);
  if (isExempt) {
    return { enforcementEnabled: true, mfaRequired: false, isExempt: true, reason: "Role '" + user.role + "' is exempt from MFA enforcement" };
  }

  const mfaStatus = await checkUserMFAConfiguration(user.id, mfaConfig.mfa_mode);
  if (mfaStatus.isFullyConfigured) {
    return { enforcementEnabled: true, mfaRequired: false, isFullyConfigured: true, reason: 'User has MFA configured', mfaStatus };
  }

  const gracePeriodStatus = checkGracePeriodStatus(user);
  if (gracePeriodStatus.hasGracePeriod && gracePeriodStatus.isWithinGracePeriod) {
    return {
      enforcementEnabled: true, mfaRequired: false, mfaSetupRequired: false, gracePeriodActive: true,
      daysRemaining: gracePeriodStatus.daysRemaining, gracePeriodEnd: gracePeriodStatus.gracePeriodEnd,
      reason: 'Grace period active - ' + gracePeriodStatus.daysRemaining + ' days remaining', mfaStatus
    };
  }

  return {
    enforcementEnabled: true, mfaRequired: true, mfaSetupRequired: true,
    gracePeriodExpired: gracePeriodStatus.hasGracePeriod && gracePeriodStatus.isExpired,
    reason: gracePeriodStatus.isExpired ? 'Grace period expired - MFA setup required' : 'MFA setup required for new users',
    mfaStatus, mfaMode: mfaConfig.mfa_mode
  };
};

const applyGracePeriodToExistingUsers = async (gracePeriodDays) => {
  const now = new Date();
  const gracePeriodEnd = calculateGracePeriodEnd(now, gracePeriodDays);

  try {
    const usersQuery = 'SELECT u.id, u.email, u.role FROM users u WHERE u.is_active = true AND u.mfa_grace_period_end IS NULL AND NOT EXISTS (SELECT 1 FROM mfa_secrets ms WHERE ms.user_id = u.id AND ms.enabled = true)';
    const usersResult = await db.query(usersQuery);
    const usersWithoutMFA = usersResult.rows;

    let appliedCount = 0;
    for (const user of usersWithoutMFA) {
      const isExempt = await isRoleExempt(user.role);
      if (!isExempt) {
        await db.query('UPDATE users SET mfa_setup_required = true, mfa_grace_period_start = $1, mfa_grace_period_end = $2 WHERE id = $3', [now, gracePeriodEnd, user.id]);
        appliedCount++;
      }
    }
    return { success: true, totalUsers: usersWithoutMFA.length, appliedCount, gracePeriodEnd, gracePeriodDays };
  } catch (error) {
    console.error('Error applying grace period to existing users:', error);
    throw error;
  }
};

const markUserRequiresMFASetup = async (userId) => {
  await db.query('UPDATE users SET mfa_setup_required = true, mfa_grace_period_start = NULL, mfa_grace_period_end = NULL WHERE id = $1', [userId]);
};

const markMFASetupCompleted = async (userId) => {
  await db.query('UPDATE users SET mfa_setup_required = false, mfa_setup_completed = true, mfa_setup_completed_at = $1, mfa_grace_period_start = NULL, mfa_grace_period_end = NULL WHERE id = $2', [new Date(), userId]);
};

const getEnforcementStatistics = async () => {
  const mfaConfig = await MFAConfig.get();

  const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
  const totalUsers = parseInt(totalUsersResult.rows[0].count) || 0;

  const usersWithMFAResult = await db.query('SELECT COUNT(DISTINCT u.id) as count FROM users u WHERE u.is_active = true AND EXISTS (SELECT 1 FROM mfa_secrets ms WHERE ms.user_id = u.id AND ms.enabled = true)');
  const usersWithMFA = parseInt(usersWithMFAResult.rows[0].count) || 0;

  const usersInGracePeriodResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true AND mfa_setup_required = true AND mfa_grace_period_end > NOW()');
  const usersInGracePeriod = parseInt(usersInGracePeriodResult.rows[0].count) || 0;

  const usersExpiredResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true AND mfa_setup_required = true AND mfa_grace_period_end <= NOW()');
  const usersExpired = parseInt(usersExpiredResult.rows[0].count) || 0;

  const usersPendingSetupResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true AND mfa_setup_required = true AND mfa_grace_period_end IS NULL');
  const usersPendingSetup = parseInt(usersPendingSetupResult.rows[0].count) || 0;

  const exemptRolesResult = await db.query('SELECT role FROM mfa_role_config WHERE exempt_from_mfa = true');
  const exemptRoles = exemptRolesResult.rows;

  let exemptUsersCount = 0;
  if (exemptRoles.length > 0) {
    const roleNames = exemptRoles.map(r => r.role);
    const placeholders = roleNames.map((_, i) => '$' + (i + 1)).join(', ');
    const exemptUsersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true AND role IN (' + placeholders + ')', roleNames);
    exemptUsersCount = parseInt(exemptUsersResult.rows[0].count) || 0;
  }

  return {
    enforcementEnabled: mfaConfig.mfa_enforcement_enabled || false,
    gracePeriodDays: mfaConfig.enforcement_grace_period_days || 14,
    enforcementStartedAt: mfaConfig.enforcement_started_at,
    mfaMode: mfaConfig.mfa_mode,
    statistics: {
      totalUsers, usersWithMFA, usersWithoutMFA: totalUsers - usersWithMFA,
      usersInGracePeriod, usersExpired, usersPendingSetup, exemptUsers: exemptUsersCount,
      exemptRoles: exemptRoles.map(r => r.role),
      complianceRate: totalUsers > 0 ? Math.round((usersWithMFA / totalUsers) * 100) : 0
    }
  };
};

module.exports = {
  isRoleExempt, checkUserMFAConfiguration, calculateGracePeriodEnd, checkGracePeriodStatus,
  getEnforcementStatus, applyGracePeriodToExistingUsers, markUserRequiresMFASetup,
  markMFASetupCompleted, getEnforcementStatistics
};
