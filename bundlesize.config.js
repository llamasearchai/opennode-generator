/**
 * Bundle Size Configuration
 * Enforces performance budgets and monitors bundle growth
 */
module.exports = [
  {
    path: './dist/index.js',
    maxSize: '200kb',
    compression: 'gzip'
  },
  {
    path: './dist/index.esm.js', 
    maxSize: '200kb',
    compression: 'gzip'
  },
  {
    path: './dist/cli.js',
    maxSize: '150kb',
    compression: 'gzip'
  },
  {
    path: './dist/core/*.js',
    maxSize: '100kb',
    compression: 'gzip'
  },
  {
    path: './dist/**/*.js',
    maxSize: '500kb',
    compression: 'none'
  }
]; 