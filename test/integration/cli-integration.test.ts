/**
 * CLI Integration Tests
 * ====================
 * 
 * Tests that verify the CLI works properly with the core functionality
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';

describe('CLI Integration', () => {
  let testWorkspace: string;

  beforeEach(() => {
    testWorkspace = process.env.OPENNODE_CURRENT_TEST_DIR || (global as any).testWorkspace || '/tmp/opennode-test';
  });

  describe('opennode create command', () => {
    it('should create a package using CLI', async () => {
      const packageName = 'test-cli-package';
      const packagePath = path.join(testWorkspace, packageName);

      // Run CLI command (in non-interactive mode)
      const result = await runCLICommand([
        'create',
        packageName,
        '--type', 'library',
        '--typescript',
        '--output', testWorkspace,
        '--no-interactive'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Package created successfully');

      // Verify package was created
      expect(await fs.pathExists(packagePath)).toBe(true);
      expect(await fs.pathExists(path.join(packagePath, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(packagePath, 'src', 'index.ts'))).toBe(true);
    });

    it('should handle invalid package names', async () => {
      const result = await runCLICommand([
        'create',
        'Invalid Package Name!',
        '--no-interactive'
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('invalid package name');
    });

    it('should show help when no arguments provided', async () => {
      const result = await runCLICommand(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI-driven npm package generator');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('create');
    });
  });

  describe('opennode analyze command', () => {
    it('should analyze an existing package', async () => {
      // First create a package to analyze
      const packageName = 'analyze-test-package';
      const packagePath = path.join(testWorkspace, packageName);
      
      await createTestPackage(packagePath);

      // Run analyze command
      const result = await runCLICommand([
        'analyze',
        packagePath,
        '--json'
      ]);

      expect(result.exitCode).toBe(0);

      const analysisResult = JSON.parse(result.stdout);
      expect(analysisResult.qualityScore).toBeDefined();
      expect(analysisResult.securityIssues).toBeDefined();
      expect(analysisResult.testCoverage).toBeDefined();
    });
  });

  describe('opennode template command', () => {
    it('should list available templates', async () => {
      const result = await runCLICommand([
        'template',
        '--list'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('typescript-library');
      expect(result.stdout).toContain('react-component');
      expect(result.stdout).toContain('cli-tool');
    });

    it('should show template details', async () => {
      const result = await runCLICommand([
        'template',
        '--show', 'typescript-library'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('TypeScript Library');
      expect(result.stdout).toContain('Features:');
    });
  });

  describe('opennode ultrathink command', () => {
    it('should generate creative solutions', async () => {
      const result = await runCLICommand([
        'ultrathink',
        '--creative',
        '--idea', 'A utility for date manipulation'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Creative Solutions:');
    });
  });
});

// Helper functions
async function runCLICommand(args: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, '../../dist/cli/index.js');
    const child = spawn('node', [cliPath, ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        OPENAI_API_KEY: 'test-key'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout,
        stderr
      });
    });
  });
}

async function createTestPackage(packagePath: string): Promise<void> {
  await fs.ensureDir(packagePath);
  
  const packageJson = {
    name: 'test-package',
    version: '1.0.0',
    description: 'A test package for analysis',
    main: 'index.js',
    scripts: {
      test: 'jest'
    },
    dependencies: {},
    devDependencies: {
      jest: '^29.0.0'
    }
  };

  await fs.writeJson(path.join(packagePath, 'package.json'), packageJson, { spaces: 2 });
  
  const indexContent = `
/**
 * Test package for analysis
 */
class TestClass {
  constructor() {
    this.name = 'test';
  }

  getName() {
    return this.name;
  }
}

module.exports = TestClass;
`;

  await fs.writeFile(path.join(packagePath, 'index.js'), indexContent);
} 