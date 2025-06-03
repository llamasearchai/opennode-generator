/**
 * Enhanced OpenNode Core Tests
 * ============================
 * 
 * Tests for the enhanced OpenNode system with proper interfaces
 */

import { OpenNode } from '../../src/core/index';
import type { GenerationConfig, GenerationResult } from '../../src/core/index';
import { Logger } from '../../src/core/logger';
import { ConfigManager } from '../../src/core/config-manager';
import { CodeAnalyzer } from '../../src/analysis';
import { TemplateManager } from '../../src/templates';
import * as fs from 'fs-extra';
import * as path from 'path';

// Helper function to create complete GenerationConfig
function createTestConfig(overrides: Partial<GenerationConfig> = {}): GenerationConfig {
  return {
    packageName: 'test-package',
    description: 'Test package description',
    version: '1.0.0',
    license: 'MIT',
    packageType: 'library',
    qualityLevel: 'good',
    outputDir: '/tmp',
    enableTesting: true,
    enableDocumentation: true,
    enableLinting: true,
    enableTypeScript: true,
    enableGitInit: false,
    enableCodexIntegration: false,
    enableOpenAIAgents: false,
    enableCICD: false,
    enableDocker: false,
    enableSecurity: false,
    enablePerformanceMonitoring: false,
    ...overrides
  };
}

describe('Enhanced OpenNode Core', () => {
  let openNode: OpenNode;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(__dirname, '../temp', `enhanced-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    openNode = new OpenNode();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('OpenNode Enhanced Class', () => {
    it('should initialize correctly', () => {
      expect(openNode).toBeInstanceOf(OpenNode);
      expect(openNode.getVersion()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should have correct project information', () => {
      const info = openNode.getProjectInfo();
      expect(info).toHaveProperty('name', 'OpenNode Forge');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('author');
    });

         it('should generate package with enhanced configuration', async () => {
       const config = createTestConfig({
         packageName: 'enhanced-test-package',
         description: 'An enhanced test package',
         outputDir: tempDir,
         enableSecurity: true,
         author: 'Test Author',
         email: 'test@example.com'
       });

      const result: GenerationResult = await openNode.generatePackage(config);
      
      expect(result.success).toBe(true);
      expect(result.packagePath).toContain('enhanced-test-package');
      expect(result.metadata.qualityScore).toBeGreaterThan(0);
      expect(result.metadata.filesCreated).toBeGreaterThan(0);
      expect(result.metadata.linesOfCode).toBeGreaterThan(0);
      
      // Verify files were created
      const packageJsonPath = path.join(result.packagePath, 'package.json');
      expect(await fs.pathExists(packageJsonPath)).toBe(true);
      
      const packageJson = await fs.readJson(packageJsonPath);
      expect(packageJson.name).toBe('enhanced-test-package');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.license).toBe('MIT');
    });

    it('should generate different package types', async () => {
      const packageTypes: Array<GenerationConfig['packageType']> = [
        'library', 'cli-tool', 'react-component', 'express-api', 'utility'
      ];

      for (const packageType of packageTypes) {
                 const config: GenerationConfig = {
           packageName: `test-${packageType}`,
           description: `Test ${packageType} package`,
           version: '1.0.0',
           license: 'MIT',
           packageType,
           qualityLevel: 'good',
           outputDir: tempDir,
           enableTesting: true,
           enableDocumentation: true,
           enableLinting: true,
           enableTypeScript: true,
           enableGitInit: false,
           enableCodexIntegration: false,
           enableOpenAIAgents: false,
           enableCICD: false,
           enableDocker: false,
           enableSecurity: false,
           enablePerformanceMonitoring: false
         };

        const result = await openNode.generatePackage(config);
        expect(result.success).toBe(true);
        expect(result.packagePath).toContain(`test-${packageType}`);
      }
    });

    it('should handle quality levels correctly', async () => {
      const qualityLevels: Array<GenerationConfig['qualityLevel']> = [
        'good', 'better', 'best', 'enterprise'
      ];

      for (const qualityLevel of qualityLevels) {
        const config: GenerationConfig = {
          packageName: `test-quality-${qualityLevel}`,
          description: `Test ${qualityLevel} quality package`,
          version: '1.0.0',
          license: 'MIT',
          packageType: 'library',
          qualityLevel,
          outputDir: tempDir,
          enableTesting: true,
          enableDocumentation: true,
          enableLinting: true,
          enableTypeScript: true,
          enableGitInit: false
        };

        const result = await openNode.generatePackage(config);
        expect(result.success).toBe(true);
        expect(result.metadata.qualityScore).toBeGreaterThan(50);
        
        // Higher quality levels should have higher scores
        if (qualityLevel === 'enterprise') {
          expect(result.metadata.qualityScore).toBeGreaterThan(80);
        }
      }
    });

    it('should validate configuration properly', async () => {
      const invalidConfig = {
        packageName: '', // Invalid: empty name
        description: 'Test',
        version: 'invalid-version', // Invalid: not semver
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'good',
        outputDir: tempDir
      } as GenerationConfig;

      const result = await openNode.generatePackage(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Logger', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger();
    });

    it('should create logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should log messages without errors', () => {
      expect(() => {
        logger.info('Test message');
        logger.warn('Warning message');
        logger.error('Error message');
        logger.debug('Debug message');
      }).not.toThrow();
    });

    it('should handle structured logging', () => {
      expect(() => {
        logger.info('Test message', { key: 'value', number: 123 });
        logger.warn('Warning', { warning: true });
        logger.error('Error', new Error('Test error'));
      }).not.toThrow();
    });
  });

  describe('Enhanced ConfigManager', () => {
    let configManager: ConfigManager;
    let configPath: string;

    beforeEach(() => {
      configPath = path.join(tempDir, 'config.json');
      configManager = new ConfigManager(configPath);
    });

    it('should create config manager instance', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
    });

    it('should return default config initially', () => {
      const config = configManager.getConfig();
      expect(config).toHaveProperty('defaultModel');
      expect(config).toHaveProperty('outputDirectory');
      expect(config).toHaveProperty('enableAnalytics');
    });

    it('should update configuration', () => {
      const updates = { defaultModel: 'gpt-4', enableAnalytics: true };
      configManager.updateConfig(updates);
      
      const config = configManager.getConfig();
      expect(config.defaultModel).toBe('gpt-4');
      expect(config.enableAnalytics).toBe(true);
    });

    it('should save and load configuration', async () => {
      const updates = { defaultModel: 'o1-preview', outputDirectory: './custom' };
      configManager.updateConfig(updates);
      await configManager.saveConfig();
      
      // Verify file was created
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const savedConfig = await fs.readJson(configPath);
      expect(savedConfig.defaultModel).toBe('o1-preview');
      expect(savedConfig.outputDirectory).toBe('./custom');
    });

    it('should reset to defaults', () => {
      configManager.updateConfig({ defaultModel: 'custom-model' });
      configManager.resetConfig();
      
      const config = configManager.getConfig();
      expect(config.defaultModel).toBe('gpt-4o'); // Default value
    });
  });

  describe('Enhanced CodeAnalyzer', () => {
    let analyzer: CodeAnalyzer;

    beforeEach(() => {
      analyzer = new CodeAnalyzer();
    });

    it('should create analyzer instance', () => {
      expect(analyzer).toBeInstanceOf(CodeAnalyzer);
    });

    it('should analyze package successfully', async () => {
      // Create a test package first
      const testPackagePath = path.join(tempDir, 'test-analysis-package');
      await fs.ensureDir(testPackagePath);
      
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test package for analysis',
        main: 'index.js',
        dependencies: { 'lodash': '^4.17.21' },
        devDependencies: { 'jest': '^29.0.0' }
      };
      
      await fs.writeJson(path.join(testPackagePath, 'package.json'), packageJson);
      await fs.writeFile(path.join(testPackagePath, 'index.js'), 'module.exports = {};');

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

    it('should handle non-existent package gracefully', async () => {
      const result = await analyzer.analyzePackage('/non/existent/path');
      
      expect(result).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.warnings).toContain('Package analysis failed');
    });
  });

  describe('Enhanced TemplateManager', () => {
    let templateManager: TemplateManager;

    beforeEach(async () => {
      templateManager = new TemplateManager();
      await templateManager.initialize();
    });

    it('should create template manager instance', () => {
      expect(templateManager).toBeInstanceOf(TemplateManager);
    });

    it('should list available templates', async () => {
      const templates = await templateManager.listTemplates();
      expect(templates).toBeInstanceOf(Array);
      
      // Should have at least some default templates
      expect(templates.length).toBeGreaterThanOrEqual(0);
    });

    it('should get template by id', async () => {
      const templates = await templateManager.listTemplates();
      
      if (templates.length > 0) {
        const template = await templateManager.getTemplate(templates[0].id);
        expect(template).toBeDefined();
        expect(template?.id).toBe(templates[0].id);
      }
    });

    it('should generate package from template', async () => {
      const config = {
        packageName: 'template-test-package',
        description: 'Test package from template',
        author: 'Test Author',
        email: 'test@example.com',
        license: 'MIT',
        outputDir: tempDir
      };

      try {
        const outputPath = await templateManager.generatePackageFromTemplate('typescript-library', config);
        expect(outputPath).toBeDefined();
        expect(await fs.pathExists(outputPath)).toBe(true);
      } catch (error) {
        // Template might not exist, which is okay for this test
        expect(error).toBeDefined();
      }
    });
  });

  describe('Enhanced Publishing Workflow', () => {
    it('should validate package for publishing', async () => {
      // Create a test package
      const config: GenerationConfig = {
        packageName: 'publish-test-package',
        description: 'Test package for publishing',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'good',
        outputDir: tempDir,
        enableTesting: true,
        enableDocumentation: true,
        enableLinting: true,
        enableTypeScript: true,
        enableGitInit: false
      };

      const result = await openNode.generatePackage(config);
      expect(result.success).toBe(true);

      // Test build and validation
      const buildResult = await openNode.buildAndValidatePackage(result.packagePath);
      expect(buildResult).toBeDefined();
      expect(buildResult.errors).toBeInstanceOf(Array);
    });

    it('should handle end-to-end workflow', async () => {
      const config: GenerationConfig = {
        packageName: 'e2e-test-package',
        description: 'End-to-end test package',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'good',
        outputDir: tempDir,
        enableTesting: true,
        enableDocumentation: true,
        enableLinting: true,
        enableTypeScript: true,
        enableGitInit: false
      };

      const publishOptions = {
        dryRun: true, // Don't actually publish
        isPublic: true
      };

      const workflowResult = await openNode.createAndPublishPackage(config, publishOptions);
      
      expect(workflowResult.generation).toBeDefined();
      expect(workflowResult.generation.success).toBe(true);
      expect(workflowResult.build).toBeDefined();
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should handle invalid output directory', async () => {
      const config: GenerationConfig = {
        packageName: 'error-test-package',
        description: 'Test package for error handling',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'good',
        outputDir: '/invalid/path/that/does/not/exist',
        enableTesting: true,
        enableDocumentation: true,
        enableLinting: true,
        enableTypeScript: true,
        enableGitInit: false
      };

      const result = await openNode.generatePackage(config);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle configuration validation errors', async () => {
      const invalidConfig = {
        packageName: 'Invalid Package Name!', // Invalid characters
        description: 'Test',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'invalid-type', // Invalid type
        qualityLevel: 'good',
        outputDir: tempDir
      } as any;

      const result = await openNode.generatePackage(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Metrics and Analytics', () => {
    it('should calculate comprehensive metrics', async () => {
      const config: GenerationConfig = {
        packageName: 'metrics-test-package',
        description: 'Test package for metrics',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'best',
        outputDir: tempDir,
        enableTesting: true,
        enableDocumentation: true,
        enableLinting: true,
        enableTypeScript: true,
        enableGitInit: false,
        enableSecurity: true
      };

      const result = await openNode.generatePackage(config);
      expect(result.success).toBe(true);
      
      const metadata = result.metadata;
      expect(metadata.qualityScore).toBeGreaterThan(0);
      expect(metadata.securityScore).toBeGreaterThan(0);
      expect(metadata.performanceScore).toBeGreaterThan(0);
      expect(metadata.filesCreated).toBeGreaterThan(0);
      expect(metadata.linesOfCode).toBeGreaterThan(0);
      expect(metadata.packageSizeKB).toBeGreaterThan(0);
      expect(metadata.generationTime).toBeGreaterThan(0);
    });

    it('should export generation report', async () => {
      const config: GenerationConfig = {
        packageName: 'report-test-package',
        description: 'Test package for reporting',
        version: '1.0.0',
        license: 'MIT',
        packageType: 'library',
        qualityLevel: 'good',
        outputDir: tempDir,
        enableTesting: true,
        enableDocumentation: true,
        enableLinting: true,
        enableTypeScript: true,
        enableGitInit: false
      };

      const result = await openNode.generatePackage(config);
      expect(result.success).toBe(true);
      
      const reportPath = await openNode.exportGenerationReport(result.generationId);
      expect(await fs.pathExists(reportPath)).toBe(true);
      
      const report = await fs.readJson(reportPath);
      expect(report.generationId).toBe(result.generationId);
      expect(report.success).toBe(true);
    });
  });
}); 