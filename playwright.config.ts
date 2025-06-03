import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 * Includes cross-browser testing, visual regression, and performance monitoring
 */
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-results/html' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['junit', { outputFile: 'e2e-results/junit.xml' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'e2e-results/allure' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'] },
    }
  ],
  webServer: {
    command: 'npm run api:dev',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  outputDir: 'e2e-results/test-results/',
  globalSetup: require.resolve('./test/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./test/e2e/global-teardown.ts'),
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'strict',
      threshold: 0.2,
      maxDiffPixels: 1000,
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 1000,
    }
  }
}); 