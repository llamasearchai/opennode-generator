/**
 * End-to-End Test Setup
 * =====================
 * 
 * Setup for E2E tests that test the complete application workflow
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Extend timeout for E2E tests as they can be slow
jest.setTimeout(120000);

// Global E2E test environment
let e2eWorkspace: string;

beforeAll(async () => {
  // Create E2E test workspace
  e2eWorkspace = path.join(os.tmpdir(), `opennode-e2e-${Date.now()}`);
  await fs.ensureDir(e2eWorkspace);
  
  // Set environment variables for E2E tests
  process.env.OPENNODE_E2E_WORKSPACE = e2eWorkspace;
  process.env.OPENNODE_TEST_MODE = 'e2e';
  process.env.NODE_ENV = 'test';
  
  console.log(`E2E test workspace: ${e2eWorkspace}`);
});

afterAll(async () => {
  // Clean up E2E workspace
  if (e2eWorkspace && await fs.pathExists(e2eWorkspace)) {
    await fs.remove(e2eWorkspace);
  }
});

beforeEach(async () => {
  // Create isolated test environment for each E2E test
  const testId = `e2e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const testDir = path.join(e2eWorkspace, testId);
  await fs.ensureDir(testDir);
  
  process.env.OPENNODE_CURRENT_E2E_DIR = testDir;
  process.env.OPENNODE_CURRENT_E2E_ID = testId;
  
  // Ensure test workspace is available globally
  global.testWorkspace = testDir;
});

afterEach(async () => {
  // Cleanup after each E2E test
  const testDir = process.env.OPENNODE_CURRENT_E2E_DIR;
  if (testDir && await fs.pathExists(testDir)) {
    // For E2E tests, we might want to keep artifacts on failure
    const currentTest = expect.getState().currentTestName;
    const testFailed = expect.getState().assertionCalls === 0;
    
    if (!testFailed) {
      await fs.remove(testDir);
    } else {
      console.log(`E2E test failed, preserving artifacts at: ${testDir}`);
    }
  }
});

export {}; 