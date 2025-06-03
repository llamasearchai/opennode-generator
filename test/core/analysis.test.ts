/**
 * Code Analysis Engine Tests
 * ==========================
 * 
 * Comprehensive test suite for the code analysis engine
 */

import { CodeAnalyzer } from '../../src/analysis';
import * as fs from 'fs-extra';

// Mock fs-extra with jest.MockedFunction
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock SecurityManager
jest.mock('../../src/security', () => ({
  SecurityManager: jest.fn().mockImplementation(() => ({
    scanDirectory: jest.fn().mockResolvedValue({
      score: 85,
      vulnerabilities: [],
      recommendations: []
    })
  }))
}));

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;
  const testPackagePath = '/test/package';

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
    jest.clearAllMocks();

    // Setup basic mock responses
    (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(true);
    (mockFs.readJson as jest.MockedFunction<typeof fs.readJson>).mockResolvedValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: { 'lodash': '^4.17.21' },
      devDependencies: { 'jest': '^29.0.0' }
    });
    (mockFs.readFile as any).mockResolvedValue('export class Test {}');
    (mockFs.readdir as any).mockResolvedValue(['src']);
    (mockFs.stat as any).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true
    });
  });

  describe('initialization', () => {
    it('should initialize correctly', () => {
      expect(analyzer).toBeInstanceOf(CodeAnalyzer);
    });
  });

  describe('analyzePackage', () => {
    it('should analyze package successfully', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result).toMatchObject({
        qualityScore: expect.any(Number),
        fileCount: expect.any(Number),
        dependencyCount: expect.any(Number),
        testCoverage: expect.any(Number),
        performanceScore: expect.any(Number),
        securityScore: expect.any(Number),
        maintainabilityScore: expect.any(Number),
        bundleSize: expect.any(String),
        recommendations: expect.any(Array),
        insights: expect.any(Array),
        warnings: expect.any(Array)
      });

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should handle non-existent package path', async () => {
      (mockFs.pathExists as jest.MockedFunction<any>).mockResolvedValue(false);

      const result = await analyzer.analyzePackage('/non/existent/path');

      expect(result.qualityScore).toBe(50);
      expect(result.warnings).toContain('Package analysis failed');
    });

    it('should handle missing package.json', async () => {
      (mockFs.pathExists as jest.MockedFunction<typeof fs.pathExists>).mockImplementation(
        (filePath: string) => {
          if (filePath === testPackagePath) return Promise.resolve(true);
          if (typeof filePath === 'string' && filePath.includes('package.json')) {
            return Promise.resolve(false);
          }
          return Promise.resolve(false);
        }
      );

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.dependencyCount).toBe(0);
    });

    it('should analyze code quality correctly', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.metrics).toMatchObject({
        linesOfCode: expect.any(Number),
        codeComplexity: expect.any(Number),
        technicalDebt: expect.any(Number),
        duplication: expect.any(Number),
        maintainabilityIndex: expect.any(Number)
      });

      expect(result.codeQuality).toMatchObject({
        eslintIssues: expect.any(Number),
        typeScriptErrors: expect.any(Number),
        codeSmells: expect.any(Array),
        refactoringOpportunities: expect.any(Array),
        bestPractices: {
          followed: expect.any(Array),
          missing: expect.any(Array)
        }
      });
    });

    it('should analyze testing correctly', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.testing).toMatchObject({
        coverage: {
          lines: expect.any(Number),
          functions: expect.any(Number),
          branches: expect.any(Number),
          statements: expect.any(Number)
        },
        testFiles: expect.any(Number),
        testSuites: expect.any(Number),
        testTypes: expect.any(Array),
        missingTests: expect.any(Array)
      });

      expect(result.testing.coverage.lines).toBeGreaterThanOrEqual(0);
      expect(result.testing.coverage.lines).toBeLessThanOrEqual(100);
    });

    it('should analyze documentation correctly', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.documentation).toMatchObject({
        readmeQuality: expect.any(Number),
        apiDocumentation: expect.any(Number),
        inlineComments: expect.any(Number),
        examples: expect.any(Number),
        missingDocs: expect.any(Array)
      });
    });

    it('should analyze dependencies correctly', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.dependencies).toMatchObject({
        total: expect.any(Number),
        direct: expect.any(Number),
        dev: expect.any(Number),
        outdated: expect.any(Array),
        vulnerable: expect.any(Array),
        unused: expect.any(Array),
        licenses: expect.any(Object)
      });
    });

    it('should generate appropriate recommendations', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should estimate bundle size correctly', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.bundleSize).toMatch(/^\d+(\.\d+)?(KB|MB)$/);
    });

    it('should handle file reading errors gracefully', async () => {
      (mockFs.readFile as any).mockRejectedValue(new Error('File read error'));

      const result = await analyzer.analyzePackage(testPackagePath);

      // Should still return a result with fallback values
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle JSON parsing errors', async () => {
      (mockFs.readJson as jest.MockedFunction<typeof fs.readJson>).mockRejectedValue(
        new Error('JSON parse error')
      );

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.dependencyCount).toBe(0);
    });
  });

  describe('error scenarios', () => {
    it('should handle general analysis errors', async () => {
      (mockFs.pathExists as jest.MockedFunction<any>).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should return fallback analysis on complete failure', async () => {
      // Mock all operations to fail
      (mockFs.pathExists as jest.MockedFunction<any>).mockRejectedValue(
        new Error('System error')
      );
      (mockFs.readJson as jest.MockedFunction<typeof fs.readJson>).mockRejectedValue(
        new Error('Read error')
      );
      (mockFs.readFile as any).mockRejectedValue(new Error('File error'));

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.qualityScore).toBe(50);
      expect(result.warnings).toContain('Package analysis failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty package', async () => {
      (mockFs.readdir as any).mockResolvedValue([]);

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result).toBeDefined();
      expect(result.metrics.linesOfCode).toBe(0);
    });

    it('should handle package with no dependencies', async () => {
      (mockFs.readJson as jest.MockedFunction<typeof fs.readJson>).mockResolvedValue({
        name: 'test-package',
        version: '1.0.0'
      });

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.dependencies.total).toBe(0);
    });

    it('should handle complex code patterns', async () => {
      (mockFs.readFile as any).mockResolvedValue(`
        function complex() {
          if (condition1) {
            for (let i = 0; i < 10; i++) {
              while (condition2) {
                switch (value) {
                  case 'a':
                    try {
                      // TODO: fix this
                      console.log('debug');
                    } catch (e) {
                      // FIXME: handle error
                    }
                    break;
                }
              }
            }
          }
        }
      `);

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.metrics.codeComplexity).toBeGreaterThan(0);
      expect(result.metrics.technicalDebt).toBeGreaterThan(0);
    });

    it('should detect best practices', async () => {
      (mockFs.pathExists as jest.MockedFunction<typeof fs.pathExists>).mockImplementation(
        (filePath: string) => {
          if (filePath === testPackagePath) return Promise.resolve(true);
          if (typeof filePath === 'string' && filePath.includes('tsconfig.json')) {
            return Promise.resolve(true);
          }
          if (typeof filePath === 'string' && filePath.includes('.eslintrc.js')) {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }
      );

      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.codeQuality.bestPractices.followed).toContain('TypeScript configuration');
      expect(result.codeQuality.bestPractices.followed).toContain('ESLint configuration');
    });
  });

  describe('performance and scalability', () => {
    it('should handle large file structures efficiently', async () => {
      // Mock many files
      const manyFiles = Array.from({ length: 100 }, (_, i) => `file${i}.ts`);
      (mockFs.readdir as any).mockResolvedValue(manyFiles);

      const startTime = Date.now();
      const result = await analyzer.analyzePackage(testPackagePath);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should provide meaningful quality scores', async () => {
      const result = await analyzer.analyzePackage(testPackagePath);

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
      expect(result.performanceScore).toBeGreaterThanOrEqual(0);
      expect(result.performanceScore).toBeLessThanOrEqual(100);
      expect(result.maintainabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.maintainabilityScore).toBeLessThanOrEqual(100);
    });
  });
}); 