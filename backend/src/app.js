/**
 * Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const testEmailRoutes = require('./routes/test-email');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Test routes (development only)
if (config.env === 'development') {
  app.use('/api/test-email', testEmailRoutes);
  console.log('📧 Test email routes enabled (development mode)');
}

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication System API',
    version: '0.1.0',
    documentation: '/api/docs',
  });
});

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

module.exports = app;
