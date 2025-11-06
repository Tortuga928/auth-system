/**
 * Database connection and query utilities
 */

const { Pool } = require('pg');
const config = require('../config');

// Create connection pool
const pool = new Pool({
  connectionString: config.database.url,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Query database
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (config.env === 'development') {
      console.log('Executed query:', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Database client
 */
const getClient = () => {
  return pool.connect();
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully at:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close all database connections
 */
const close = async () => {
  await pool.end();
  console.log('Database pool closed');
};

module.exports = {
  query,
  getClient,
  testConnection,
  close,
  pool,
};
