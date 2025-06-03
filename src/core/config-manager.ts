/**
 * Configuration Manager for OpenNode Forge
 * Handles application configuration and settings
 */

import * as fs from 'fs-extra';
import path from 'path';
import { Logger } from './logger';

export interface OpenNodeConfig {
  defaultModel: string;
  outputDirectory: string;
  defaultQuality: string;
  enableAnalytics: boolean;
  author?: string;
  email?: string;
  license?: string;
  features: {
    ultraThink: boolean;
    codeAnalysis: boolean;
    securityScanning: boolean;
  };
  ai: {
    apiKey?: string;
    timeout: number;
    maxRetries: number;
    models: {
      [key: string]: {
        maxTokens: number;
        temperature: number;
        topP: number;
      };
    };
  };
  templates: {
    directory: string;
    defaultTemplate: string;
  };
  testing: {
    defaultFramework: string;
    coverageThreshold: number;
    enableE2E: boolean;
  };
  deployment: {
    registry: string;
    dockerRegistry?: string;
    autoPublish: boolean;
  };
}

export class ConfigManager {
  private config: OpenNodeConfig;
  private configPath: string;
  private logger: Logger;

  constructor(configPath?: string) {
    this.logger = new Logger();
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.getDefaultConfig();
    // Initialize asynchronously without blocking constructor
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await this.loadConfig();
    } catch (error) {
      // If loading fails, we'll continue with default config
      this.logger.warn(
        'Failed to load config during initialization, using defaults'
      );
    }
  }

  private getDefaultConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    return path.join(homeDir, '.opennode', 'config.json');
  }

  private getDefaultConfig(): OpenNodeConfig {
    return {
      defaultModel: 'gpt-4o',
      outputDirectory: './packages',
      defaultQuality: 'premium',
      enableAnalytics: true,
      author: 'Unknown',
      email: 'developer@example.com',
      license: 'MIT',
      features: {
        ultraThink: true,
        codeAnalysis: true,
        securityScanning: true,
      },
      ai: {
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
        maxRetries: 3,
        models: {
          'gpt-4o': {
            maxTokens: 4096,
            temperature: 0.7,
            topP: 1,
          },
          'gpt-4o-mini': {
            maxTokens: 2048,
            temperature: 0.7,
            topP: 1,
          },
          'o1-preview': {
            maxTokens: 8192,
            temperature: 0.5,
            topP: 1,
          },
          'o1-mini': {
            maxTokens: 4096,
            temperature: 0.5,
            topP: 1,
          },
          'o3-mini': {
            maxTokens: 2048,
            temperature: 0.6,
            topP: 1,
          },
        },
      },
      templates: {
        directory: './templates',
        defaultTemplate: 'typescript-library',
      },
      testing: {
        defaultFramework: 'jest',
        coverageThreshold: 80,
        enableE2E: false,
      },
      deployment: {
        registry: 'https://registry.npmjs.org/',
        autoPublish: false,
      },
    };
  }

  public async loadConfig(): Promise<void> {
    try {
      // Ensure directory exists first
      await fs.ensureDir(path.dirname(this.configPath));

      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.config = this.mergeConfig(this.getDefaultConfig(), configData);
        this.logger.info('Configuration loaded successfully');
      } else {
        // Create default config file
        await this.saveConfig();
        this.logger.info('Default configuration created');
      }
    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      // Don't re-throw the error in saveConfig during loadConfig
    }
  }

  private mergeConfig(
    defaultConfig: OpenNodeConfig,
    userConfig: any
  ): OpenNodeConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      features: {
        ...defaultConfig.features,
        ...userConfig.features,
      },
      ai: {
        ...defaultConfig.ai,
        ...userConfig.ai,
        models: {
          ...defaultConfig.ai.models,
          ...userConfig.ai?.models,
        },
      },
      templates: {
        ...defaultConfig.templates,
        ...userConfig.templates,
      },
      testing: {
        ...defaultConfig.testing,
        ...userConfig.testing,
      },
      deployment: {
        ...defaultConfig.deployment,
        ...userConfig.deployment,
      },
    };
  }

  async saveConfig(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      this.logger.info('Configuration saved successfully');
    } catch (error) {
      this.logger.error('Failed to save configuration', error);
      throw error;
    }
  }

  getConfig(): OpenNodeConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<OpenNodeConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.config.ai.apiKey = apiKey;
    await this.saveConfig();
  }

  getApiKey(): string | undefined {
    return this.config.ai.apiKey;
  }

  getModelConfig(model: string): any {
    return this.config.ai.models[model] || this.config.ai.models['gpt-4o'];
  }

  isFeatureEnabled(feature: keyof OpenNodeConfig['features']): boolean {
    return this.config.features[feature];
  }

  getOutputDirectory(): string {
    return this.config.outputDirectory;
  }

  getTemplateDirectory(): string {
    return this.config.templates.directory;
  }

  getCoverageThreshold(): number {
    return this.config.testing.coverageThreshold;
  }

  async resetToDefaults(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.saveConfig();
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.defaultModel) {
      errors.push('Default model is required');
    }

    if (!this.config.outputDirectory) {
      errors.push('Output directory is required');
    }

    if (
      this.config.testing.coverageThreshold < 0 ||
      this.config.testing.coverageThreshold > 100
    ) {
      errors.push('Coverage threshold must be between 0 and 100');
    }

    if (this.config.ai.timeout < 1000) {
      errors.push('AI timeout must be at least 1000ms');
    }

    if (this.config.ai.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  get(key: string): any {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }

    return current;
  }

  resetConfig(): void {
    this.config = this.getDefaultConfig();
  }
}
