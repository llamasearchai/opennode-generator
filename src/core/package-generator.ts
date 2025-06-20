/**
 * Package Generator
 * ================
 *
 * Core package generation engine
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from './logger';
import { ConfigManager } from './config-manager';

export interface GenerationConfig {
  packageName: string;
  description: string;
  type: string;
  features: string[];
  typescript: boolean;
  outputDir: string;
  template?: string;
  author?: string;
  license?: string;
  ultraThink?: boolean;
}

export interface GenerationResult {
  success: boolean;
  packagePath: string;
  qualityScore: number;
  files: string[];
  errors: string[];
}

export class PackageGenerator {
  private logger: Logger;
  private config: ConfigManager;

  constructor() {
    this.logger = new Logger();
    this.config = new ConfigManager();
  }

  private validateConfig(config: GenerationConfig): void {
    // Validate package name
    if (!config.packageName) {
      throw new Error('Package name is required');
    }

    // Check for invalid characters in package name (excluding scoped packages)
    if (
      !config.packageName.startsWith('@') &&
      !/^[a-z0-9-]+$/.test(config.packageName)
    ) {
      throw new Error(
        `Invalid package name: ${config.packageName}. Package names must contain only lowercase letters, numbers, and hyphens.`
      );
    }

    // Validate scoped package names
    if (config.packageName.startsWith('@')) {
      const scopedPackagePattern = /^@[a-z0-9-]+\/[a-z0-9-]+$/;
      if (!scopedPackagePattern.test(config.packageName)) {
        throw new Error(
          `Invalid scoped package name: ${config.packageName}. Must be in format @scope/package-name`
        );
      }
    }

    // Validate description
    if (!config.description) {
      throw new Error('Package description is required');
    }

    // Validate output directory
    if (!config.outputDir) {
      throw new Error('Output directory is required');
    }
  }
  async generatePackage(config: GenerationConfig): Promise<GenerationResult> {
    this.logger.info('Starting package generation', { config });

    try {
      // Validate configuration
      this.validateConfig(config);

      // Create package directory
      const packagePath = path.join(config.outputDir, config.packageName);
      await fs.ensureDir(packagePath);

      // Generate package.json
      await this.generatePackageJson(packagePath, config);

      // Generate source files
      const files = await this.generateSourceFiles(packagePath, config);

      // Generate tests
      await this.generateTests(packagePath, config);

      // Generate documentation
      await this.generateDocs(packagePath, config);

      // Generate TypeScript configuration if enabled
      if (config.typescript) {
        await this.generateTsConfig(packagePath);
        files.push(path.join(packagePath, 'tsconfig.json'));
      }

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(packagePath);

      this.logger.info('Package generation completed successfully');

      return {
        success: true,
        packagePath,
        qualityScore,
        files,
        errors: [],
      };
    } catch (error) {
      this.logger.error('Package generation failed', error);
      throw error;
    }
  }

  private async generatePackageJson(
    packagePath: string,
    config: GenerationConfig
  ): Promise<void> {
    const packageJson = {
      name: config.packageName,
      version: '1.0.0',
      description: config.description,
      main: config.typescript ? 'dist/index.js' : 'src/index.js',
      types: config.typescript ? 'dist/index.d.ts' : undefined,
      scripts: {
        build: config.typescript ? 'tsc' : 'echo "No build needed"',
        test: 'jest',
        lint: 'eslint src/**/*.ts',
        dev: config.typescript ? 'tsc --watch' : 'nodemon src/index.js',
      },
      keywords: config.features,
      author: config.author || 'Generated by OpenNode Forge',
      license: config.license || 'MIT',
      dependencies: {},
      devDependencies: config.typescript
        ? {
            typescript: '^5.2.0',
            '@types/node': '^20.5.0',
            jest: '^29.6.0',
            '@types/jest': '^29.5.0',
            'ts-jest': '^29.1.0',
          }
        : {
            jest: '^29.6.0',
          },
    };

    await fs.writeFile(
      path.join(packagePath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private async generateSourceFiles(
    packagePath: string,
    config: GenerationConfig
  ): Promise<string[]> {
    const srcDir = path.join(packagePath, 'src');
    await fs.ensureDir(srcDir);

    const files: string[] = [];

    // Generate main index file
    const indexContent = config.typescript
      ? this.generateTypeScriptIndex(config)
      : this.generateJavaScriptIndex(config);

    const indexFile = path.join(
      srcDir,
      `index.${config.typescript ? 'ts' : 'js'}`
    );
    await fs.writeFile(indexFile, indexContent);
    files.push(indexFile);

    // Generate additional files based on type
    if (config.type === 'cli-tool') {
      const cliContent = this.generateCLIContent(config);
      const cliFile = path.join(
        srcDir,
        `cli.${config.typescript ? 'ts' : 'js'}`
      );
      await fs.writeFile(cliFile, cliContent);
      files.push(cliFile);
    }

    return files;
  }

  private generateTypeScriptIndex(config: GenerationConfig): string {
    return `/**
 * ${config.packageName}
 * ${config.description}
 */

export class ${this.toPascalCase(config.packageName)} {
  private name: string;

  constructor(name: string = '${config.packageName}') {
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }

  public greet(): string {
    return \`Hello from \${this.name}!\`;
  }
}

export default ${this.toPascalCase(config.packageName)};
`;
  }

  private generateJavaScriptIndex(config: GenerationConfig): string {
    return `/**
 * ${config.packageName}
 * ${config.description}
 */

class ${this.toPascalCase(config.packageName)} {
  constructor(name = '${config.packageName}') {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  greet() {
    return \`Hello from \${this.name}!\`;
  }
}

module.exports = ${this.toPascalCase(config.packageName)};
module.exports.${this.toPascalCase(config.packageName)} = ${this.toPascalCase(config.packageName)};
`;
  }

  private generateCLIContent(config: GenerationConfig): string {
    return `#!/usr/bin/env node

/**
 * CLI for ${config.packageName}
 */

const program = require('commander');
const package = require('../package.json');

program
  .version(package.version)
  .description(package.description);

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from ${config.packageName}!');
  });

program.parse(process.argv);
`;
  }

  private async generateTests(
    packagePath: string,
    config: GenerationConfig
  ): Promise<void> {
    const testDir = path.join(packagePath, 'test');
    await fs.ensureDir(testDir);

    const testContent = config.typescript
      ? this.generateTypeScriptTest(config)
      : this.generateJavaScriptTest(config);

    await fs.writeFile(
      path.join(testDir, `index.test.${config.typescript ? 'ts' : 'js'}`),
      testContent
    );
  }

  private generateTypeScriptTest(config: GenerationConfig): string {
    const className = this.toPascalCase(config.packageName);
    return `import ${className} from '../src/index';

describe('${className}', () => {
  it('should create an instance', () => {
    const instance = new ${className}();
    expect(instance).toBeInstanceOf(${className});
  });

  it('should return the correct name', () => {
    const instance = new ${className}();
    expect(instance.getName()).toBe('${config.packageName}');
  });

  it('should greet correctly', () => {
    const instance = new ${className}();
    expect(instance.greet()).toBe('Hello from ${config.packageName}!');
  });
});
`;
  }

  private generateJavaScriptTest(config: GenerationConfig): string {
    const className = this.toPascalCase(config.packageName);
    return `const ${className} = require('../src/index');

describe('${className}', () => {
  it('should create an instance', () => {
    const instance = new ${className}();
    expect(instance).toBeInstanceOf(${className});
  });

  it('should return the correct name', () => {
    const instance = new ${className}();
    expect(instance.getName()).toBe('${config.packageName}');
  });

  it('should greet correctly', () => {
    const instance = new ${className}();
    expect(instance.greet()).toBe('Hello from ${config.packageName}!');
  });
});
`;
  }

  private async generateDocs(
    packagePath: string,
    config: GenerationConfig
  ): Promise<void> {
    const readmeContent = `# ${config.packageName}

${config.description}

## Installation

\`\`\`bash
npm install ${config.packageName}
\`\`\`

## Usage

\`\`\`javascript
const ${this.toPascalCase(config.packageName)} = require('${config.packageName}');

const instance = new ${this.toPascalCase(config.packageName)}();
console.log(instance.greet());
\`\`\`

## API

### ${this.toPascalCase(config.packageName)}

#### Constructor

- \`new ${this.toPascalCase(config.packageName)}(name?: string)\`

#### Methods

- \`getName(): string\` - Returns the name
- \`greet(): string\` - Returns a greeting message

## License

MIT
`;

    await fs.writeFile(path.join(packagePath, 'README.md'), readmeContent);
  }

  private async calculateQualityScore(packagePath: string): Promise<number> {
    // Simple quality scoring algorithm
    let score = 70; // Base score

    // Check for TypeScript
    if (await fs.pathExists(path.join(packagePath, 'tsconfig.json'))) {
      score += 10;
    }

    // Check for tests
    if (await fs.pathExists(path.join(packagePath, 'test'))) {
      score += 10;
    }

    // Check for README
    if (await fs.pathExists(path.join(packagePath, 'README.md'))) {
      score += 5;
    }

    // Check for package.json
    if (await fs.pathExists(path.join(packagePath, 'package.json'))) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private async generateTsConfig(packagePath: string): Promise<void> {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'test'],
    };

    await fs.writeFile(
      path.join(packagePath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(
        /\w+/g,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .replace(/\s/g, '');
  }
}
