# opennode-forge

[![npm version](https://badge.fury.io/js/opennode-forge.svg)](https://badge.fury.io/js/opennode-forge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/nikjois/opennode-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/nikjois/opennode-forge/actions/workflows/ci.yml)

A comprehensive npm package generator for creating modern JavaScript and TypeScript packages with automated scaffolding, best-practice templates, and development tooling setup.

## 🚀 Features

- **AI-Powered Generation**: Uses OpenAI GPT-4 for intelligent code generation
- **Complete Automation**: Automated testing, building, and deployment
- **FastAPI Integration**: Built-in REST API endpoints
- **Docker Support**: Production-ready containerization
- **TypeScript First**: Full TypeScript support with type definitions
- **Security Scanning**: Built-in security vulnerability detection
- **Performance Monitoring**: Integrated performance tracking
- **Quality Assurance**: Comprehensive testing and quality metrics

## 📦 Installation

```bash
npm install -g opennode-forge
```

## 🔥 Quick Start

```bash
# Generate a complete package
opennode generate "my-awesome-package" --output ./packages

# Generate with all features
opennode master "enterprise-package" --api --docker --tests

# Analyze package quality
opennode analyze ./my-package

# Run comprehensive tests
opennode test ./my-package --coverage
```

## 🛠 API Usage

```javascript
import { OpenNode } from 'opennode-forge';

const openNode = new OpenNode({
  openaiApiKey: 'your-api-key',
  enableFastAPI: true,
  enableDocker: true
});

const result = await openNode.generatePackage('my-package', {
  packageType: 'library',
  qualityLevel: 'enterprise',
  enableTesting: true,
  enableDocumentation: true
});

console.log(`Package generated at: ${result.outputPath}`);
```

## 🏗 Architecture

OpenNode Forge consists of several integrated components:

- **Core Engine**: Package generation and orchestration
- **AI Agents**: OpenAI-powered intelligent code generation
- **Template System**: Flexible package templates
- **Quality Analyzer**: Code quality and security analysis
- **Build System**: Automated building and optimization
- **API Layer**: FastAPI integration for web services

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [CLI Reference](./docs/cli.md)
- [Examples](./examples/)
- [Contributing Guide](./CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🐳 Docker

```bash
# Build Docker image
docker build -t opennode-forge .

# Run container
docker run -p 3000:3000 opennode-forge

# Using docker-compose
docker-compose up
```

## 🔧 Configuration

Create a `.opennode` configuration file:

```json
{
  "openaiApiKey": "your-api-key",
  "defaultQuality": "enterprise",
  "enableFeatures": {
    "fastAPI": true,
    "docker": true,
    "security": true,
    "monitoring": true
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙋 Support

- [GitHub Issues](https://github.com/nikjois/opennode-forge/issues)
- [Discord Community](https://discord.gg/opennode)
- [Email Support](mailto:nikjois@llamasearch.ai)

## 🏆 Acknowledgments

- OpenAI for GPT-4 API
- The Node.js community
- All contributors and users

---

Made with ❤️ by the OpenNode team
