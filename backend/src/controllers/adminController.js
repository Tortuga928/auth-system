/**
 * Admin Controller
 *
 * Handles admin panel operations - user management, audit logs, dashboard stats
 * All methods require admin or super_admin role (enforced by routes)
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Get all users with pagination and filtering
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      role,
      status,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    // Convert status to is_active boolean
    let is_active;
    if (status === 'active') is_active = true;
    if (status === 'inactive') is_active = false;

    const options = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      role,
      is_active,
      search,
      sortBy,
      sortOrder,
    };

    const result = await User.findAll(options);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};

/**
 * Get user details by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdWithDetails(parseInt(id, 10));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
};

/**
 * Create new user
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'username, email, and password are required',
      });
    }

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Only super_admin can create super_admin users
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super administrators can create super_admin users',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      role,
    });

    // Admin-created users are auto-verified
    await User.update(user.id, { email_verified: true });

    const createdUser = await User.findById(user.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: createdUser },
    });
  } catch (error) {
    console.error('Create user error:', error);

    // Handle duplicate email/username
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const existingUser = await User.findById(parseInt(id, 10));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Admins cannot update their own role or status
    if (parseInt(id, 10) === req.user.id && (updates.role || updates.is_active !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify your own role or status',
      });
    }

    // Only super_admin can change user to super_admin
    if (updates.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super administrators can grant super_admin role',
      });
    }

    // Allowed fields for update
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const user = await User.update(parseInt(id, 10), filteredUpdates);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

/**
 * Delete/deactivate user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(parseInt(id, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-deletion
    if (parseInt(id, 10) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Soft delete (deactivate)
    const deleted = await User.deactivate(parseInt(id, 10));

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

/**
 * Update user role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validation
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      });
    }

    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check if user exists
    const existingUser = await User.findById(parseInt(id, 10));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-role change
    if (parseInt(id, 10) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    // Check if trying to grant super_admin role
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super administrators can grant super_admin role',
      });
    }

    const user = await User.update(parseInt(id, 10), { role });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

/**
 * Update user status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Validation
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_active field is required',
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value',
      });
    }

    // Check if user exists
    const existingUser = await User.findById(parseInt(id, 10));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-status modification
    if (parseInt(id, 10) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own status',
      });
    }

    // Activate or deactivate user
    let success;
    if (is_active) {
      success = await User.activate(parseInt(id, 10));
    } else {
      success = await User.deactivate(parseInt(id, 10));
    }

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status',
      });
    }

    // Get updated user
    const user = await User.findById(parseInt(id, 10));

    res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

/**
 * Search users
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    // Validation
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required',
      });
    }

    // Validate limit
    const searchLimit = parseInt(limit, 10);
    if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }

    const users = await User.search(q.trim(), searchLimit);

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message,
    });
  }
};

/**
 * Get audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    // Stub implementation for Story 10.1
    res.status(200).json({
      success: true,
      message: 'Admin: Get audit logs (stub)',
      data: {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        },
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: error.message,
    });
  }
};

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Stub implementation for Story 10.1
    res.status(200).json({
      success: true,
      message: 'Admin: Get dashboard stats (stub)',
      data: {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        adminCount: 0,
        suspendedCount: 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get user growth statistics
 */
exports.getUserGrowth = async (req, res) => {
  try {
    // Stub implementation for Story 10.1
    res.status(200).json({
      success: true,
      message: 'Admin: Get user growth (stub)',
      data: {
        labels: [],
        data: [],
      },
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user growth data',
      error: error.message,
    });
  }
};

/**
 * Get activity summary
 */
exports.getActivitySummary = async (req, res) => {
  try {
    // Stub implementation for Story 10.1
    res.status(200).json({
      success: true,
      message: 'Admin: Get activity summary (stub)',
      data: {
        loginAttemptsToday: 0,
        failedLoginsToday: 0,
        activeSessionsNow: 0,
        securityEventsToday: 0,
      },
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity summary',
      error: error.message,
    });
  }
};

/**
 * Get security overview
 */
exports.getSecurityOverview = async (req, res) => {
  try {
    // Stub implementation for Story 10.1
    res.status(200).json({
      success: true,
      message: 'Admin: Get security overview (stub)',
      data: {
        criticalAlertsCount: 0,
        mfaEnabledPercentage: 0,
        recentFailedLogins: [],
        suspiciousActivity: [],
      },
    });
  } catch (error) {
    console.error('Get security overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security overview',
      error: error.message,
    });
  }
};
