const path = require('path');

module.exports = {
  testEnvironment: 'node',
  roots: [path.resolve(__dirname, 'tests')],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  
  // Explicit coverage paths
  collectCoverageFrom: [
    '**/functions/csv-utils.js',
    '**/functions/csv-processor.js',
    '!**/node_modules/**',
    '!**/*.test.js',
    '!**/test-utils.js',
    '!**/index.js'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  verbose: true
};