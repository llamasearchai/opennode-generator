/**
 * Global test setup for OpenNode
 * Configures Jest environment and test utilities
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock OpenAI API key for tests
process.env.OPENAI_API_KEY = 'test-key';

// Global test timeout
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  // Ensure test directories exist
  const tempDir = path.join(os.tmpdir(), 'opennode-test');
  await fs.ensureDir(tempDir);
  
  // Set test environment variables
  process.env.OPENNODE_TEST_DIR = tempDir;
});

// Global cleanup
afterAll(async () => {
  // Clean up test directories if they exist
  const tempDir = process.env.OPENNODE_TEST_DIR;
  if (tempDir && await fs.pathExists(tempDir)) {
    await fs.remove(tempDir);
  }
});

// Mock OpenAI API calls for tests
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  suggestedType: 'library',
                  confidence: 0.8,
                  complexityScore: 5,
                  suggestedFeatures: ['TypeScript', 'Jest'],
                  recommendedStack: ['Node.js', 'TypeScript'],
                  estimatedTime: '2-4 hours',
                  challenges: ['API design']
                })
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock console methods to reduce noise in tests
beforeEach(() => {
  // Mock console.log, console.warn, but keep console.error for debugging
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Add custom Jest matchers if needed
expect.extend({
  toBeValidPackageName(received: string) {
    const pass = /^[@]?[a-z0-9-~][a-z0-9-._~]*$/.test(received);
    return {
      message: () => `expected ${received} to be a valid npm package name`,
      pass,
    };
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPackageName(): R;
    }
  }
  
  var testWorkspace: string;
}

export {}; 