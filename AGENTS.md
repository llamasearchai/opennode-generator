# OpenNode Forge - AI Agent Instructions

This file contains comprehensive instructions for AI agents working on the OpenNode Forge project.

## Project Overview

**Package Name:** @opennode/forge
**Description:** AI-powered npm package generator with OpenAI Codex CLI integration and automated publishing
**Type:** CLI Tool / Library
**Quality Level:** Enterprise

## Development Guidelines

### Code Style

- Always use TypeScript for all source code
- Follow ESLint and Prettier configurations strictly
- Write comprehensive tests for all functionality
- Use meaningful commit messages following conventional commits
- Maintain 100% type safety with strict TypeScript settings

### AI Agent Instructions

#### Package Generation

- Focus on creating production-ready, enterprise-quality packages
- Ensure generated packages include comprehensive testing suites
- Always include proper TypeScript configurations and type definitions
- Generate packages with CI/CD integration (GitHub Actions)
- Include Docker configurations for containerized applications
- Implement proper error handling and validation throughout

#### OpenAI Codex CLI Integration

- Ensure seamless integration with OpenAI Codex CLI
- Generate proper .codex/config.json files with appropriate settings
- Create comprehensive AGENTS.md files for generated packages
- Include npm scripts for common Codex operations
- Test Codex integration thoroughly

#### Code Quality Standards

- Maintain high code quality scores (>85%)
- Implement proper security measures and validation
- Use dependency injection and modular architecture
- Follow SOLID principles and clean code practices
- Ensure proper separation of concerns

### Testing Strategy

- Write unit tests for all core functionality with Jest
- Include integration tests for external dependencies
- Aim for >90% test coverage on critical paths
- Test error scenarios and edge cases
- Include end-to-end tests for complete workflows
- Mock external APIs properly in tests

### Security Considerations

- Validate all user inputs with Zod schemas
- Use secure dependencies and audit regularly
- Follow OWASP best practices for CLI applications
- Implement proper token handling for npm/GitHub publishing
- Sanitize file paths and prevent directory traversal
- Use environment variables for sensitive configuration

### Performance Guidelines

- Optimize for CLI responsiveness and user experience
- Use streaming and progress indicators for long operations
- Implement proper caching strategies for repeated operations
- Monitor bundle size and startup time
- Use efficient algorithms for package generation
- Implement proper memory management

### OpenAI Integration Best Practices

- Use appropriate models for different tasks (o4-mini for standard operations)
- Implement proper error handling for API failures
- Use streaming responses where appropriate
- Implement rate limiting and retry logic
- Cache AI responses when appropriate
- Provide fallback mechanisms when AI is unavailable

## Custom Prompts

When working on this project, use these specific prompts:

- "Generate a production-ready npm package with full TypeScript support, comprehensive testing, and CI/CD integration"
- "Optimize the package generation algorithms for speed and quality"
- "Ensure OpenAI Codex CLI integration works seamlessly with generated packages"
- "Review security implications of file generation and user input handling"
- "Improve error handling and user experience for CLI operations"
- "Add comprehensive validation for all configuration schemas"

## Architecture Notes

OpenNode Forge follows a modular architecture with clear separation of concerns:

### Core Components

- **Core Engine** (`src/core/`): Main package generation logic with OpenAI integration
- **CLI Interface** (`src/cli/`): Command-line interface with interactive prompts
- **Templates** (`src/templates/`): Reusable package templates and scaffolding
- **Analysis** (`src/analysis/`): Code analysis and quality scoring
- **Monitoring** (`src/monitoring/`): Performance monitoring and metrics

### Key Features

- TypeScript-first development with strict type checking
- Comprehensive testing infrastructure with Jest
- CI/CD integration with GitHub Actions
- Docker containerization support
- OpenAI Codex CLI deep integration
- Automated npm and GitHub publishing
- Real-time package validation and quality scoring

### Dependencies Management

- Keep dependencies minimal and focused
- Prefer stable, well-maintained packages
- Use peer dependencies for optional integrations
- Regular dependency audits and updates
- Proper version pinning for stability

### Integration Points

- **OpenAI API**: For AI-powered package generation and code analysis
- **GitHub API**: For repository creation and management via Octokit
- **npm Registry**: For package publishing and validation
- **Codex CLI**: For seamless AI-assisted development workflows

## Workflow Instructions

### Development Workflow

1. Use `npm run dev` for development with watch mode
2. Run tests continuously with `npm run test:watch`
3. Use Codex integration: `npm run codex:review` for code reviews
4. Validate changes with `npm run lint` before committing
5. Build and test thoroughly before publishing

### Publishing Workflow

1. Ensure all tests pass: `npm test`
2. Run quality checks: `npm run lint`
3. Build the project: `npm run build`
4. Test publishing: `npm run publish:dry`
5. Publish to npm: `npm run publish:npm`
6. Verify publication and functionality

### AI-Assisted Development

- Use `codex "Initialize this package for development"` for setup
- Use `codex "Review this codebase for improvements"` for code review
- Use `codex "Run tests and fix any issues"` for automated testing
- Use `codex "Optimize package generation performance"` for performance improvements

## Error Handling Standards

- Use proper TypeScript error types
- Implement comprehensive validation with Zod
- Provide clear, actionable error messages
- Log errors appropriately with structured logging
- Implement graceful degradation for non-critical failures
- Use proper HTTP status codes for API interactions

## Documentation Standards

- Maintain up-to-date README with comprehensive examples
- Document all public APIs with JSDoc comments
- Include architecture diagrams for complex systems
- Provide troubleshooting guides for common issues
- Keep CHANGELOG updated with all significant changes
- Include performance benchmarks and quality metrics

## Quality Metrics

Target metrics for the project:

- Code coverage: >90%
- TypeScript strict mode: 100%
- ESLint errors: 0
- Security audit: Clean
- Performance: CLI startup <2s
- Package generation: <30s for standard packages
- Quality score: >85 for all generated packages

Generated by OpenNode Forge v1.0.0
