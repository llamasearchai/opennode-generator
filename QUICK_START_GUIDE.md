# OpenNode - Quick Start Guide

## **Get Started in 5 Minutes**

### **1. Installation & Setup**

```bash
# Clone or use the OpenNode directory
cd OpenNode

# Install dependencies
npm install

# Build the complete system
npm run build
```

### **2. Run the Demo**

```bash
# Experience the complete master program
node demo.js
```

This will demonstrate:

- ✅ AI-powered package generation
- ✅ Complete automated testing setup
- ✅ Docker integration
- ✅ FastAPI endpoints
- ✅ OpenAI agents integration
- ✅ Build automation

### **3. Generate Your First Package**

```bash
# Use the CLI to generate a complete package
npx opennode generate \
  --name "my-awesome-package" \
  --description "My first OpenNode package" \
  --type "library" \
  --quality "enterprise" \
  --typescript \
  --tests \
  --docker \
  --fastapi \
  --agents
```

### **4. Available Commands**

```bash
# Generate packages with AI assistance
npx opennode generate [options]

# Run comprehensive automated tests
npx opennode test <package-path>

# Analyze code quality and security
npx opennode analyze <package-path>

# Docker operations
npx opennode docker <package-path> --build --run

# FastAPI server operations
npx opennode fastapi <package-path> --start

# AI agents operations
npx opennode agents <package-path> --optimize

# Complete build automation
npx opennode build <package-path>
```

### **5. Complete Build & Test**

```bash
# Run the complete build process
./scripts/build-complete.sh

# Run comprehensive deployment
./scripts/deploy.sh
```

### **6. Test Everything**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### **7. Package Features Generated**

When you generate a package, you get:

#### **📁 Complete Package Structure**

- ✅ TypeScript configuration
- ✅ Testing framework (Jest)
- ✅ Linting (ESLint + Prettier)
- ✅ GitHub Actions CI/CD
- ✅ Docker configuration
- ✅ FastAPI integration
- ✅ OpenAI agents setup
- ✅ Security scanning
- ✅ Documentation

#### **🔧 Development Tools**

- ✅ Hot reloading
- ✅ Auto-formatting
- ✅ Type checking
- ✅ Code quality gates
- ✅ Pre-commit hooks

#### **🚀 Deployment Ready**

- ✅ npm publishing
- ✅ Docker containers
- ✅ Cloud deployment
- ✅ Kubernetes support
- ✅ CI/CD pipelines

### **8. Configuration Options**

```typescript
const config = {
  packageName: 'my-package',
  description: 'Package description',
  version: '1.0.0',
  license: 'MIT',
  packageType: 'library' | 'cli-tool' | 'react-component' | 'express-api',
  qualityLevel: 'good' | 'better' | 'best' | 'enterprise',
  enableTesting: true,
  enableDocumentation: true,
  enableLinting: true,
  enableTypeScript: true,
  enableGitInit: true,
  enableCodexIntegration: true,
  enableOpenAIAgents: true,
  enableCICD: true,
  enableDocker: true,
  enableSecurity: true,
  enablePerformanceMonitoring: true,
};
```

### **9. Environment Variables**

```bash
# Required for AI features
export OPENAI_API_KEY="your-openai-api-key"

# Optional for enhanced features
export GITHUB_TOKEN="your-github-token"
export NPM_TOKEN="your-npm-token"
export DOCKER_REGISTRY="your-docker-registry"
```

### **10. Production Deployment**

```bash
# Build for production
npm run build

# Run production tests
npm run test:ci

# Deploy to npm
npm publish

# Deploy to Docker registry
docker push your-registry/package-name

# Deploy to cloud
./scripts/deploy.sh
```

## **🎯 What You Get**

### **Generated Package Includes:**

- ✅ **Complete TypeScript setup** with strict type checking
- ✅ **Comprehensive test suite** with Jest and coverage reports
- ✅ **Docker containerization** with multi-stage builds
- ✅ **FastAPI Python integration** with RESTful endpoints
- ✅ **OpenAI agents configuration** for AI-powered development
- ✅ **GitHub Actions CI/CD** with automated deployment
- ✅ **Security scanning** with vulnerability detection
- ✅ **Performance monitoring** with metrics collection
- ✅ **Quality gates** with linting and formatting
- ✅ **Documentation** with API docs and examples

### **Development Experience:**

- ✅ **Beautiful CLI** with colors and interactive prompts
- ✅ **Intelligent code generation** with AI assistance
- ✅ **Automatic optimization** and best practices
- ✅ **Error handling** with helpful debugging information
- ✅ **Progress tracking** with detailed feedback

## **🆘 Need Help?**

### **Documentation:**

- Read `README.md` for detailed information
- Check `COMPLETE_MASTER_PROGRAM_SUMMARY.md` for full feature list
- Review generated package documentation

### **Troubleshooting:**

1. Ensure Node.js 18+ is installed
2. Set required environment variables
3. Check network connectivity for AI features
4. Verify Docker is running for containerization
5. Run `npm run type-check` for TypeScript issues

### **Support:**

- Check the generated package's README for specific instructions
- Review test files for usage examples
- Examine the demo script for implementation patterns

**🎉 Happy coding with OpenNode!**
