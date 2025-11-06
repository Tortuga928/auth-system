/**
 * Server startup
 */

const app = require('./app');
const config = require('./config');

const PORT = config.port;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Authentication System - Backend API                 ║
║                                                           ║
║   Environment: ${config.env.padEnd(43)}║
║   Port:        ${PORT.toString().padEnd(43)}║
║   Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║                                                           ║
║   📝 Press Ctrl+C to stop                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = server;
