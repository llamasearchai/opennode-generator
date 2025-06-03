/**
 * PackageGenerator Tests
 * =====================
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { PackageGenerator } from '../../src/core/package-generator';
import type { GenerationConfig } from '../../src/core/package-generator';

describe('PackageGenerator', () => {
  let generator: PackageGenerator;
  let tempDir: string;

  beforeEach(async () => {
    generator = new PackageGenerator();
    tempDir = path.join(os.tmpdir(), `opennode-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('generatePackage', () => {
    it('should generate a basic TypeScript package', async () => {
      const config: GenerationConfig = {
        packageName: 'test-package',
        description: 'A test package',
        type: 'library',
        features: ['typescript', 'jest'],
        typescript: true,
        outputDir: tempDir,
        author: 'Test Author',
        license: 'MIT',
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);
      expect(result.packagePath).toBe(path.join(tempDir, 'test-package'));
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Check if package.json was created
      const packageJsonPath = path.join(result.packagePath, 'package.json');
      expect(await fs.pathExists(packageJsonPath)).toBe(true);

      const packageJson = await fs.readJson(packageJsonPath);
      expect(packageJson.name).toBe('test-package');
      expect(packageJson.description).toBe('A test package');
      expect(packageJson.author).toBe('Test Author');
      expect(packageJson.license).toBe('MIT');
    });

    it('should generate a JavaScript package when typescript is false', async () => {
      const config: GenerationConfig = {
        packageName: 'js-package',
        description: 'A JavaScript package',
        type: 'library',
        features: ['jest'],
        typescript: false,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);

      // Check if JavaScript index file was created
      const indexPath = path.join(result.packagePath, 'src', 'index.js');
      expect(await fs.pathExists(indexPath)).toBe(true);

      const indexContent = await fs.readFile(indexPath, 'utf8');
      expect(indexContent).toContain('module.exports');
    });

    it('should generate CLI tool structure', async () => {
      const config: GenerationConfig = {
        packageName: 'test-cli',
        description: 'A CLI tool',
        type: 'cli-tool',
        features: ['typescript', 'commander'],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);

      // Check if CLI file was created
      const cliPath = path.join(result.packagePath, 'src', 'cli.ts');
      expect(await fs.pathExists(cliPath)).toBe(true);

      const cliContent = await fs.readFile(cliPath, 'utf8');
      expect(cliContent).toContain('#!/usr/bin/env node');
      expect(cliContent).toContain('commander');
    });

    it('should generate test files', async () => {
      const config: GenerationConfig = {
        packageName: 'test-with-tests',
        description: 'A package with tests',
        type: 'library',
        features: ['typescript', 'jest'],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);

      // Check if test file was created
      const testPath = path.join(result.packagePath, 'test', 'index.test.ts');
      expect(await fs.pathExists(testPath)).toBe(true);

      const testContent = await fs.readFile(testPath, 'utf8');
      expect(testContent).toContain('describe');
      expect(testContent).toContain('expect');
    });

    it('should generate documentation files', async () => {
      const config: GenerationConfig = {
        packageName: 'documented-package',
        description: 'A well-documented package',
        type: 'library',
        features: ['typescript', 'documentation'],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);

      // Check if README was created
      const readmePath = path.join(result.packagePath, 'README.md');
      expect(await fs.pathExists(readmePath)).toBe(true);

      const readmeContent = await fs.readFile(readmePath, 'utf8');
      expect(readmeContent).toContain('documented-package');
      expect(readmeContent).toContain('Installation');
      expect(readmeContent).toContain('Usage');
    });

    it('should handle generation errors gracefully', async () => {
      const config: GenerationConfig = {
        packageName: 'test-package',
        description: 'A test package',
        type: 'library',
        features: [],
        typescript: true,
        outputDir: '/invalid/path/that/does/not/exist',
      };

      await expect(generator.generatePackage(config)).rejects.toThrow();
    });

    it('should validate package name format', async () => {
      const invalidConfig: GenerationConfig = {
        packageName: 'Invalid Package Name!',
        description: 'Invalid package name',
        type: 'library',
        features: [],
        typescript: true,
        outputDir: tempDir,
      };

      await expect(generator.generatePackage(invalidConfig)).rejects.toThrow();
    });

    it('should calculate quality score correctly', async () => {
      const config: GenerationConfig = {
        packageName: 'high-quality-package',
        description: 'A high-quality package',
        type: 'library',
        features: ['typescript', 'jest', 'eslint', 'prettier', 'documentation'],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(70); // High quality threshold
    });

    it('should support UltraThink mode', async () => {
      const config: GenerationConfig = {
        packageName: 'ultrathink-package',
        description: 'An UltraThink enhanced package',
        type: 'library',
        features: ['typescript'],
        typescript: true,
        outputDir: tempDir,
        ultraThink: true,
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);
      // UltraThink should enhance the package with additional features
      expect(result.qualityScore).toBeGreaterThan(60);
    });
  });

  describe('edge cases', () => {
    it('should handle missing dependencies gracefully', async () => {
      const config: GenerationConfig = {
        packageName: 'test-package',
        description: 'Test package',
        type: 'library',
        features: [],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in package name', async () => {
      const config: GenerationConfig = {
        packageName: '@scope/package-name',
        description: 'Scoped package',
        type: 'library',
        features: ['typescript'],
        typescript: true,
        outputDir: tempDir,
      };

      const result = await generator.generatePackage(config);
      expect(result.success).toBe(true);

      const packageJson = await fs.readJson(path.join(result.packagePath, 'package.json'));
      expect(packageJson.name).toBe('@scope/package-name');
    });
  });
}); 