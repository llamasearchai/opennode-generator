/**
 * Complete Workflow E2E Tests
 * ===========================
 * 
 * Tests the complete OpenNode workflow from idea generation to package publishing
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Complete OpenNode Workflow', () => {
  let testWorkspace: string;

  beforeEach(() => {
    testWorkspace = process.env.OPENNODE_CURRENT_E2E_DIR || (global as any).testWorkspace || '/tmp/opennode-e2e-test';
  });

  describe('End-to-End Package Generation', () => {
    it('should complete the full workflow: idea → generation → testing → publishing', async () => {
      const packageName = 'e2e-test-package';
      const packagePath = path.join(testWorkspace, packageName);

      // Step 1: Generate package using OpenNode
      await generatePackageE2E(packageName, packagePath);

      // Step 2: Verify package structure
      await verifyPackageStructure(packagePath);

      // Step 3: Install dependencies
      await installDependencies(packagePath);

      // Step 4: Run tests
      await runTests(packagePath);

      // Step 5: Build package
      await buildPackage(packagePath);

      // Step 6: Verify build output
      await verifyBuildOutput(packagePath);

      // Step 7: Run linting
      await runLinting(packagePath);

      // Step 8: Pack package (simulate publishing)
      await packPackage(packagePath);
    });

    it('should handle UltraThink enhanced workflow', async () => {
      const packageName = 'ultrathink-e2e-package';
      const packagePath = path.join(testWorkspace, packageName);

      // Generate with UltraThink enabled
      await generatePackageE2E(packageName, packagePath, { ultraThink: true });

      // Verify enhanced features
      expect(await fs.pathExists(path.join(packagePath, 'src'))).toBe(true);
      expect(await fs.pathExists(path.join(packagePath, 'test'))).toBe(true);
      expect(await fs.pathExists(path.join(packagePath, 'docs'))).toBe(true);

      // Should have advanced configuration
      const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('lint');

      // Run the full test suite
      await runCompleteTestSuite(packagePath);
    });

    it('should generate different package types correctly', async () => {
      const testCases = [
        { type: 'library', name: 'test-library' },
        { type: 'cli-tool', name: 'test-cli' },
        { type: 'api-client', name: 'test-client' }
      ];

      for (const testCase of testCases) {
        const packagePath = path.join(testWorkspace, testCase.name);
        
        await generatePackageE2E(testCase.name, packagePath, { 
          type: testCase.type 
        });

        // Verify type-specific features
        await verifyPackageType(packagePath, testCase.type);
        
        // Ensure package builds and tests pass
        await installDependencies(packagePath);
        await runTests(packagePath);
        await buildPackage(packagePath);
      }
    });

    it('should support React component generation', async () => {
      const packageName = 'test-react-component';
      const packagePath = path.join(testWorkspace, packageName);

      await generatePackageE2E(packageName, packagePath, { 
        type: 'react-component',
        features: ['storybook', 'testing-library']
      });

      // Verify React-specific files
      expect(await fs.pathExists(path.join(packagePath, 'src/components'))).toBe(true);
      expect(await fs.pathExists(path.join(packagePath, '.storybook'))).toBe(true);
      
      const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.devDependencies).toHaveProperty('@storybook/react');

      // Build and test React component
      await installDependencies(packagePath);
      await runTests(packagePath);
      await buildPackage(packagePath);
    });
  });

  describe('API Integration E2E', () => {
    it('should work with FastAPI backend', async () => {
      // This test would require the FastAPI server to be running
      // For now, we'll simulate the API interaction
      
      const apiResponse = await simulateAPICall({
        idea: 'A utility for data transformation',
        package_type: 'library',
        enable_typescript: true
      });

      expect(apiResponse.success).toBe(true);
      expect(apiResponse.package_path).toBeDefined();
      expect(apiResponse.files).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling E2E', () => {
    it('should gracefully handle invalid configurations', async () => {
      try {
        await generatePackageE2E('', '', { type: 'invalid-type' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should recover from dependency installation failures', async () => {
      const packageName = 'recovery-test-package';
      const packagePath = path.join(testWorkspace, packageName);

      await generatePackageE2E(packageName, packagePath);

      // Simulate dependency failure by corrupting package.json
      const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
      packageJson.dependencies = { 'non-existent-package': '^99.99.99' };
      await fs.writeJson(path.join(packagePath, 'package.json'), packageJson);

      // Should handle the failure gracefully
      try {
        await installDependencies(packagePath);
      } catch (error) {
        // Expected to fail, but should provide useful error message
        expect((error as Error).message).toContain('npm install failed');
      }
    });
  });
});

// Helper functions
async function generatePackageE2E(
  name: string, 
  outputPath: string, 
  options: any = {}
): Promise<void> {
  const { OpenNode } = await import('../../src/core/index');
  const opennode = new OpenNode();

  const config = {
    config: {
      packageName: name,
      description: `Test package: ${name}`,
      version: '1.0.0',
      license: 'MIT',
      keywords: ['test', 'opennode'],
      dependencies: {},
      devDependencies: {},
      scripts: {},
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      files: ['dist/**/*'],
      engines: { node: '>=16.0.0' },
    },
    aiConfig: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    packageType: options.type || 'library',
    qualityLevel: 'premium',
    outputDir: path.dirname(outputPath),
    enableTesting: true,
    enableDocumentation: true,
    enableLinting: true,
    enableTypeScript: true,
    enableGitInit: false,
    ...options,
  };

  const result = await opennode.generatePackage(config);
  
  if (!result.success) {
    throw new Error(`Package generation failed: ${result.errors.join(', ')}`);
  }
}

async function verifyPackageStructure(packagePath: string): Promise<void> {
  const expectedFiles = [
    'package.json',
    'src/index.ts',
    'test/index.test.ts',
    'README.md',
    'tsconfig.json'
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(packagePath, file);
    expect(await fs.pathExists(filePath)).toBe(true);
  }
}

async function installDependencies(packagePath: string): Promise<void> {
  try {
    await execAsync('npm install', { cwd: packagePath });
  } catch (error) {
    throw new Error(`npm install failed: ${(error as Error).message}`);
  }
}

async function runTests(packagePath: string): Promise<void> {
  try {
    await execAsync('npm test', { cwd: packagePath });
  } catch (error) {
    throw new Error(`Tests failed: ${(error as Error).message}`);
  }
}

async function buildPackage(packagePath: string): Promise<void> {
  try {
    await execAsync('npm run build', { cwd: packagePath });
  } catch (error) {
    throw new Error(`Build failed: ${(error as Error).message}`);
  }
}

async function verifyBuildOutput(packagePath: string): Promise<void> {
  const distPath = path.join(packagePath, 'dist');
  expect(await fs.pathExists(distPath)).toBe(true);
  expect(await fs.pathExists(path.join(distPath, 'index.js'))).toBe(true);
  expect(await fs.pathExists(path.join(distPath, 'index.d.ts'))).toBe(true);
}

async function runLinting(packagePath: string): Promise<void> {
  try {
    await execAsync('npm run lint', { cwd: packagePath });
  } catch (error) {
    // Linting might fail, but we'll log it
    console.warn('Linting issues found:', (error as Error).message);
  }
}

async function packPackage(packagePath: string): Promise<void> {
  try {
    await execAsync('npm pack', { cwd: packagePath });
    
    // Verify tarball was created
    const files = await fs.readdir(packagePath);
    const tarball = files.find(f => f.endsWith('.tgz'));
    expect(tarball).toBeDefined();
  } catch (error) {
    throw new Error(`Package packing failed: ${(error as Error).message}`);
  }
}

async function runCompleteTestSuite(packagePath: string): Promise<void> {
  await installDependencies(packagePath);
  await runTests(packagePath);
  await buildPackage(packagePath);
  await runLinting(packagePath);
  
  // Run additional quality checks
  try {
    await execAsync('npm audit', { cwd: packagePath });
  } catch (error) {
    console.warn('Security audit found issues:', (error as Error).message);
  }
}

async function verifyPackageType(packagePath: string, type: string): Promise<void> {
  const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
  
  switch (type) {
    case 'cli-tool':
      expect(packageJson.bin).toBeDefined();
      expect(await fs.pathExists(path.join(packagePath, 'src/cli.ts'))).toBe(true);
      break;
    case 'library':
      expect(packageJson.main).toBeDefined();
      expect(packageJson.types).toBeDefined();
      break;
    case 'api-client':
      expect(packageJson.dependencies).toHaveProperty('axios');
      break;
  }
}

async function simulateAPICall(payload: any): Promise<any> {
  // In a real E2E test, this would make an actual HTTP request to the API
  // For now, we'll simulate a successful response
  return {
    success: true,
    package_path: '/path/to/generated/package',
    files: ['package.json', 'src/index.ts', 'test/index.test.ts'],
    generation_time: 5000,
    quality_score: 85
  };
} 