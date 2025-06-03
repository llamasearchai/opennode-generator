/**
 * Stryker Mutation Testing Configuration
 * Ensures test quality by introducing mutations and verifying tests catch them
 */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  coverageAnalysis: 'perTest',
  tsconfigFile: 'tsconfig.json',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.config.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  thresholds: {
    high: 90,
    low: 75,
    break: 70
  },
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  maxConcurrentTestRunners: 4,
  tempDirName: 'stryker-tmp',
  cleanTempDir: 'always',
  logLevel: 'info',
  fileLogLevel: 'trace',
  allowConsoleColors: true,
  dashboard: {
    project: 'github.com/opennode/opennode-forge',
    version: process.env.GITHUB_SHA || 'main',
    module: 'opennode-forge'
  },
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html'
  },
  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json'
  },
  plugins: [
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker'
  ],
  checkers: ['typescript'],
  typescriptChecker: {
    prioritizePerformanceOverAccuracy: false
  },
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    'test',
    'scripts',
    'docs'
  ]
}; 