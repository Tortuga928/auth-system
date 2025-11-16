/**
 * Cache Utility
 *
 * Provides Redis caching functionality with automatic expiration.
 * Used for caching expensive dashboard statistics queries.
 */

const redis = require('redis');
const config = require('../config');

// Redis client
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
async function initRedis() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = redis.createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Get value from cache
 *
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null if not found
 */
async function get(key) {
  try {
    if (!redisClient || !isConnected) {
      await initRedis();
    }

    if (!redisClient || !isConnected) {
      console.warn('Redis not available, skipping cache get');
      return null;
    }

    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with expiration
 *
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttl = 300) {
  try {
    if (!redisClient || !isConnected) {
      await initRedis();
    }

    if (!redisClient || !isConnected) {
      console.warn('Redis not available, skipping cache set');
      return false;
    }

    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete value from cache
 *
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  try {
    if (!redisClient || !isConnected) {
      await initRedis();
    }

    if (!redisClient || !isConnected) {
      console.warn('Redis not available, skipping cache delete');
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Clear all keys matching pattern
 *
 * @param {string} pattern - Key pattern (e.g., 'admin:stats:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function clearPattern(pattern) {
  try {
    if (!redisClient || !isConnected) {
      await initRedis();
    }

    if (!redisClient || !isConnected) {
      console.warn('Redis not available, skipping cache clear');
      return 0;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redisClient.del(keys);
    return keys.length;
  } catch (error) {
    console.error(`Cache clear error for pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Get or set cached value
 *
 * If value exists in cache, return it. Otherwise, execute the function,
 * cache the result, and return it.
 *
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} ttl - Time to live in seconds (default: 300)
 * @returns {Promise<any>} Cached or computed value
 */
async function getOrSet(key, fn, ttl = 300) {
  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function
    const value = await fn();

    // Cache the result
    await set(key, value, ttl);

    return value;
  } catch (error) {
    console.error(`Cache getOrSet error for key ${key}:`, error);
    // On error, just execute the function without caching
    return await fn();
  }
}

/**
 * Close Redis connection
 */
async function close() {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      isConnected = false;
      redisClient = null;
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}

// Initialize Redis on module load
initRedis().catch(err => {
  console.error('Failed to initialize Redis on startup:', err);
});

module.exports = {
  initRedis,
  get,
  set,
  del,
  clearPattern,
  getOrSet,
  close,
};
