# Contributing to OpenNode Forge

Thank you for your interest in contributing to OpenNode Forge! This document provides comprehensive guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Security](#security)
- [Performance Considerations](#performance-considerations)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [nikjois@llamasearch.ai](mailto:nikjois@llamasearch.ai).

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together towards common goals
- **Be professional**: Maintain professional communication

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: Latest stable version
- **TypeScript**: Basic knowledge required
- **Jest**: For testing framework
- **OpenAI API Key**: For AI-related features (optional for basic development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/yourusername/opennode-forge.git
cd opennode-forge
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/nikjois/opennode-forge.git
```

## Development Setup

### Initial Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# OPENAI_API_KEY=your-api-key-here (optional)

# Build the project
npm run build

# Run tests to verify setup
npm test

# Link for global CLI testing
npm link
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI Configuration (optional for basic development)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3

# Development Configuration
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=opennode:*

# Testing Configuration
TEST_TIMEOUT=30000
TEST_OUTPUT_DIR=./test/temp

# Build Configuration
BUILD_TARGET=es2020
BUNDLE_ANALYZE=false
```

### Development Scripts

```bash
# Development
npm run dev                 # Start development with watch mode
npm run build              # Build the project
npm run build:watch        # Build with watch mode
npm run build:clean        # Clean build artifacts

# Testing
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run format             # Format code with Prettier
npm run type-check         # TypeScript type checking
npm run validate           # Run all quality checks

# Documentation
npm run docs:build         # Build TypeDoc documentation
npm run docs:serve         # Serve documentation locally
```

## Project Structure

```
opennode-forge/
├── src/                   # Source code
│   ├── core/             # Core functionality
│   ├── cli/              # CLI implementation
│   ├── ai/               # AI integration
│   ├── analysis/         # Code analysis
│   ├── security/         # Security features
│   ├── templates/        # Template management
│   ├── types/            # TypeScript types
│   └── index.ts          # Main export
├── test/                 # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── fixtures/        # Test fixtures
├── templates/           # Package templates
├── docs/               # Documentation
├── scripts/            # Build and utility scripts
└── api/               # FastAPI integration
```

### Key Directories

- **`src/core/`**: Core package generation logic
- **`src/cli/`**: Command-line interface implementation
- **`src/ai/`**: OpenAI integration and AI agents
- **`src/analysis/`**: Code quality analysis tools
- **`src/security/`**: Security scanning and hardening
- **`src/templates/`**: Template management system
- **`test/`**: Comprehensive test suite
- **`templates/`**: Built-in package templates

## Development Workflow

### Branch Strategy

We use a Git flow-inspired branching strategy:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`bugfix/*`**: Bug fix branches
- **`hotfix/*`**: Critical hotfix branches
- **`release/*`**: Release preparation branches

### Feature Development

1. **Create a feature branch**:

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

2. **Develop your feature**:

```bash
# Make your changes
npm run build
npm test
npm run validate
```

3. **Commit your changes**:

```bash
git add .
git commit -m "feat: add your feature description"
```

4. **Push and create PR**:

```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

#### Examples

```bash
feat: add React component template generation
fix: resolve TypeScript compilation errors in CLI
docs: update API documentation for core classes
refactor: improve template selection algorithm
test: add integration tests for package publishing
perf: optimize bundle size for generated packages
```

## Coding Standards

### TypeScript Guidelines

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for object type definitions
- **Generics**: Use generics for reusable components
- **Null Safety**: Handle null and undefined explicitly

```typescript
// Good
interface GenerationConfig {
  packageName: string;
  description: string;
  packageType: PackageType;
  enableTypeScript?: boolean;
}

async function generatePackage(
  config: GenerationConfig
): Promise<GenerationResult> {
  // Implementation
}

// Avoid
function generatePackage(config: any): any {
  // Implementation
}
```

### Code Style

- **Naming Conventions**:

  - Classes: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.ts` or `camelCase.ts`

- **Function Guidelines**:

  - Keep functions small and focused
  - Use descriptive names
  - Limit parameters (max 4-5)
  - Return meaningful results

- **Class Guidelines**:
  - Single responsibility principle
  - Prefer composition over inheritance
  - Use dependency injection
  - Document public methods

### Error Handling

```typescript
// Good: Explicit error handling
async function processTemplate(
  template: Template
): Promise<Result<ProcessedTemplate, Error>> {
  try {
    const validated = await validateTemplate(template);
    const processed = await applyTemplate(validated);
    return Result.ok(processed);
  } catch (error) {
    return Result.error(
      new Error(`Template processing failed: ${error.message}`)
    );
  }
}

// Good: Custom error types
class TemplateValidationError extends Error {
  constructor(
    message: string,
    public readonly template: Template,
    public readonly validationErrors: string[]
  ) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}
```

### Async/Await Guidelines

- **Always use async/await** over Promises.then()
- **Handle errors properly** with try/catch
- **Use Promise.all** for concurrent operations
- **Avoid blocking operations** in async functions

```typescript
// Good
async function generateMultiplePackages(
  configs: GenerationConfig[]
): Promise<GenerationResult[]> {
  const promises = configs.map((config) => generatePackage(config));
  return Promise.all(promises);
}

// Avoid
function generateMultiplePackages(
  configs: GenerationConfig[]
): Promise<GenerationResult[]> {
  return new Promise((resolve, reject) => {
    // Complex promise chaining
  });
}
```

## Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete workflows
- **Performance Tests**: Test performance characteristics

### Test Organization

```
test/
├── unit/
│   ├── core/
│   ├── cli/
│   └── ai/
├── integration/
│   ├── package-generation/
│   └── template-processing/
├── e2e/
│   ├── cli-workflows/
│   └── api-endpoints/
└── fixtures/
    ├── templates/
    └── configs/
```

### Writing Tests

```typescript
// Unit test example
describe('PackageGenerator', () => {
  let generator: PackageGenerator;
  let mockAnalyzer: jest.Mocked<CodeAnalyzer>;

  beforeEach(() => {
    mockAnalyzer = createMockAnalyzer();
    generator = new PackageGenerator(mockAnalyzer);
  });

  describe('generatePackage', () => {
    it('should generate a valid package structure', async () => {
      const config: GenerationConfig = {
        packageName: 'test-package',
        packageType: 'library',
        qualityLevel: 'best',
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(true);
      expect(result.packageName).toBe('test-package');
      expect(result.files).toContain('package.json');
      expect(result.files).toContain('tsconfig.json');
    });

    it('should handle invalid configuration gracefully', async () => {
      const config: GenerationConfig = {
        packageName: '', // Invalid
        packageType: 'library',
        qualityLevel: 'best',
      };

      const result = await generator.generatePackage(config);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Package name is required');
    });
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for all code
- **Critical Paths**: 95% coverage for core functionality
- **New Features**: 90% coverage required
- **Bug Fixes**: Must include regression tests

### Mock Guidelines

```typescript
// Good: Proper mocking
jest.mock('../src/ai/openai-client', () => ({
  OpenAIClient: jest.fn().mockImplementation(() => ({
    generateCode: jest.fn().mockResolvedValue('generated code'),
    analyzeCode: jest.fn().mockResolvedValue({ score: 85 }),
  })),
}));

// Good: Factory functions for test data
function createTestConfig(
  overrides: Partial<GenerationConfig> = {}
): GenerationConfig {
  return {
    packageName: 'test-package',
    packageType: 'library',
    qualityLevel: 'good',
    enableTypeScript: true,
    ...overrides,
  };
}
```

## Documentation

### Code Documentation

- **JSDoc Comments**: All public APIs must be documented
- **Type Documentation**: Complex types should be documented
- **Example Usage**: Include examples for complex functions

````typescript
/**
 * Generates a complete npm package with AI assistance
 *
 * @param idea - Human-readable description of the package purpose
 * @param config - Configuration options for package generation
 * @returns Promise resolving to generation result with metadata
 *
 * @example
 * ```typescript
 * const result = await openNode.generatePackage('utility library', {
 *   packageName: 'my-utils',
 *   packageType: 'library',
 *   qualityLevel: 'best'
 * });
 *
 * if (result.success) {
 *   console.log(`Package created at: ${result.packagePath}`);
 * }
 * ```
 */
async generatePackage(idea: string, config: Partial<GenerationConfig>): Promise<GenerationResult> {
  // Implementation
}
````

### README Updates

When adding new features:

1. Update the main README.md
2. Add usage examples
3. Update the API reference
4. Add configuration options
5. Update the CLI command reference

### Documentation Standards

- **Clear Examples**: Provide working code examples
- **Complete Coverage**: Document all public APIs
- **Up-to-date**: Keep documentation synchronized with code
- **Beginner Friendly**: Include explanations for complex concepts

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:

```bash
npm run validate
npm test
```

2. **Update documentation**:

```bash
npm run docs:build
```

3. **Check build artifacts**:

```bash
npm run build
npm run build:clean
```

### PR Template

When creating a pull request, use this template:

```markdown
## Description

Brief description of the changes and why they were made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tests added/updated for the changes
- [ ] All tests pass locally
- [ ] Test coverage meets requirements

## Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-review of the code completed
- [ ] Code is properly documented
- [ ] Changes generate no new warnings
- [ ] Dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI pipeline must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: All tests must pass
4. **Documentation**: Documentation must be updated
5. **Performance**: No significant performance regressions

### Review Criteria

- **Functionality**: Code works as intended
- **Quality**: Follows coding standards and best practices
- **Testing**: Adequate test coverage
- **Documentation**: Properly documented
- **Performance**: No negative performance impact
- **Security**: No security vulnerabilities introduced

## Issue Guidelines

### Bug Reports

When reporting bugs, please include:

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Run command '...'
2. With configuration '...'
3. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Environment**

- OS: [e.g. macOS 14.0]
- Node.js version: [e.g. 18.17.0]
- npm version: [e.g. 9.6.7]
- OpenNode Forge version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

When suggesting features:

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
Your suggested approach to implementing this feature.

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots about the feature request.
```

### Issue Labels

- **bug**: Something isn't working
- **enhancement**: New feature or request
- **documentation**: Improvements or additions to documentation
- **good first issue**: Good for newcomers
- **help wanted**: Extra attention is needed
- **priority: high**: High priority issues
- **priority: low**: Low priority issues

## Security

### Security Policy

- **Vulnerability Reporting**: Report security issues privately to [nikjois@llamasearch.ai](mailto:nikjois@llamasearch.ai)
- **Responsible Disclosure**: Allow time for fixes before public disclosure
- **Security Updates**: Security fixes will be prioritized and released quickly

### Security Guidelines

- **Input Validation**: Validate all user inputs
- **Dependency Scanning**: Regularly update and scan dependencies
- **Secrets Management**: Never commit secrets or API keys
- **Secure Defaults**: Use secure configurations by default

## Performance Considerations

### Performance Guidelines

- **Bundle Size**: Keep bundle size optimized
- **Memory Usage**: Monitor memory consumption
- **Generation Speed**: Optimize package generation time
- **Concurrent Operations**: Support parallel processing

### Performance Testing

```typescript
// Performance test example
describe('Performance Tests', () => {
  it('should generate packages within time limits', async () => {
    const startTime = performance.now();

    const result = await openNode.generatePackage('test-package', config);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(30000); // 30 seconds max
  });
});
```

### Benchmarking

```bash
# Run performance benchmarks
npm run perf:benchmark

# Analyze bundle size
npm run perf:analyze

# Profile memory usage
npm run perf:memory
```

## Release Process

### Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Create Release Branch**:

```bash
git checkout develop
git pull upstream develop
git checkout -b release/v1.1.0
```

2. **Update Version**:

```bash
npm version minor
```

3. **Update Documentation**:

```bash
# Update CHANGELOG.md
# Update README.md if needed
# Update package.json description if needed
```

4. **Final Testing**:

```bash
npm run validate
npm test
npm run build
```

5. **Merge and Tag**:

```bash
git checkout main
git merge release/v1.1.0
git tag v1.1.0
git push upstream main --tags
```

6. **Publish**:

```bash
npm publish --access public
```

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Security scan passed
- [ ] Performance benchmarks acceptable
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)

## Getting Help

### Community Support

- **GitHub Discussions**: [Project Discussions](https://github.com/nikjois/opennode-forge/discussions)
- **GitHub Issues**: [Bug Reports and Feature Requests](https://github.com/nikjois/opennode-forge/issues)
- **Email**: [nikjois@llamasearch.ai](mailto:nikjois@llamasearch.ai)

### Development Questions

For development-related questions:

1. Check existing documentation
2. Search GitHub issues and discussions
3. Ask in GitHub discussions
4. Email maintainers for complex issues

### Contribution Recognition

Contributors are recognized in:

- **Contributors section** in README.md
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Special mentions** for major features

---

Thank you for contributing to OpenNode Forge! Your contributions help make this tool better for the entire community.
