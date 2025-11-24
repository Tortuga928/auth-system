module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Module paths
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^axios$': require.resolve('axios'),
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.cy.{js,jsx}',
  ],

  // Coverage thresholds (Story 11.2 requires >80%)
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
  ],

  // Transform files - handle ES modules from node_modules
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { rootMode: 'upward' }],
  },

  // Allow axios and other ES modules to be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Verbose output
  verbose: true,
};
