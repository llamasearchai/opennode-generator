/**
 * Integration Test Setup
 * ======================
 * 
 * Setup for integration tests that test multiple components working together
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Extend the global timeout for integration tests
jest.setTimeout(60000);

// Create isolated test environment
let testWorkspace: string;

beforeAll(async () => {
  // Create a unique test workspace
  testWorkspace = path.join(os.tmpdir(), `opennode-integration-${Date.now()}`);
  await fs.ensureDir(testWorkspace);
  
  // Set environment variables for integration tests
  process.env.OPENNODE_INTEGRATION_WORKSPACE = testWorkspace;
  process.env.OPENNODE_TEST_MODE = 'integration';
  
  console.log(`Integration test workspace: ${testWorkspace}`);
});

afterAll(async () => {
  // Clean up test workspace
  if (testWorkspace && await fs.pathExists(testWorkspace)) {
    await fs.remove(testWorkspace);
  }
});

beforeEach(async () => {
  // Create a clean test directory for each test
  const testDir = path.join(testWorkspace, `test-${Date.now()}`);
  await fs.ensureDir(testDir);
  process.env.OPENNODE_CURRENT_TEST_DIR = testDir;
  
  // Ensure test workspace is available globally
  global.testWorkspace = testDir;
});

afterEach(async () => {
  // Clean up current test directory
  const testDir = process.env.OPENNODE_CURRENT_TEST_DIR;
  if (testDir && await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }
});

export {}; 