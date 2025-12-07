/**
 * Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializePassport } = require('./config/passport');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const linkedProvidersRoutes = require('./routes/linkedProviders');
const mfaRoutes = require('./routes/mfa');
const userRoutes = require('./routes/user');
const sessionRoutes = require('./routes/session');
const securityRoutes = require('./routes/security');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const mfaAdminRoutes = require('./routes/mfaAdmin');
const email2faRoutes = require('./routes/email2fa');
const testEmailRoutes = require('./routes/test-email');

// Create Express app
const app = express();

// Security middleware - configure helmet to allow avatars and swagger
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for Swagger UI
}));

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

// Static file serving for uploaded avatars with CORS
const path = require('path');
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.cors.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Initialize Passport.js (without global session middleware)
// Session middleware will be applied only to OAuth routes
initializePassport(app);

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth System API Documentation',
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('📚 API Documentation available at /api/docs');

// API Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', linkedProvidersRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/auth/mfa', mfaRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/mfa', mfaAdminRoutes);
app.use('/api/auth/mfa', email2faRoutes);

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
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

module.exports = app;
