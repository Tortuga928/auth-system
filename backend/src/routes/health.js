/**
 * Health check routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  // Check database connection
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
});

module.exports = router;
