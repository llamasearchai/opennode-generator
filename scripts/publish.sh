#!/bin/bash

# OpenNode Forge Publishing Script
# Comprehensive build, test, and publish workflow

set -e

echo "🚀 OpenNode Forge Publishing Workflow"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we have the required environment variables
if [ -z "$NPM_TOKEN" ] && [ "$1" != "--dry-run" ]; then
    print_warning "NPM_TOKEN not set. Publishing will be skipped."
fi

# Step 1: Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf coverage/
print_success "Clean completed"

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Step 3: Run linting
print_status "Running ESLint..."
npm run lint || {
    print_warning "Linting found issues but continuing..."
}
print_success "Linting completed"

# Step 4: Run TypeScript compilation
print_status "Building TypeScript..."
npm run build
print_success "Build completed"

# Step 5: Run tests
print_status "Running tests..."
npm test
print_success "Tests passed"

# Step 6: Run test coverage
print_status "Generating test coverage..."
npm run test:coverage
print_success "Coverage generated"

# Step 7: Security audit
print_status "Running security audit..."
npm audit --audit-level high || {
    print_warning "Security audit found issues. Please review."
}

# Step 8: Package validation
print_status "Validating package..."
npm pack --dry-run
print_success "Package validation passed"

# Step 9: Version check
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Step 10: Check if this is a dry run
if [ "$1" = "--dry-run" ]; then
    print_warning "Dry run mode - skipping actual publishing"
    print_success "Dry run completed successfully!"
    exit 0
fi

# Step 11: Publish to npm
if [ -n "$NPM_TOKEN" ]; then
    print_status "Publishing to npm..."
    
    # Set npm token
    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
    
    # Publish
    npm publish --access public
    
    # Clean up token
    rm ~/.npmrc
    
    print_success "Published to npm successfully!"
else
    print_warning "Skipping npm publish (no NPM_TOKEN)"
fi

# Step 12: Git tagging (if not dry run)
if [ -n "$GITHUB_TOKEN" ] || git remote get-url origin > /dev/null 2>&1; then
    print_status "Creating git tag..."
    
    # Check if tag already exists
    if git tag -l "v$CURRENT_VERSION" | grep -q "v$CURRENT_VERSION"; then
        print_warning "Tag v$CURRENT_VERSION already exists"
    else
        git tag "v$CURRENT_VERSION"
        
        # Push tag if we have a remote
        if git remote get-url origin > /dev/null 2>&1; then
            git push origin "v$CURRENT_VERSION"
            print_success "Tag v$CURRENT_VERSION pushed to remote"
        fi
    fi
fi

# Step 13: Verification
print_status "Verifying publication..."

# Wait a moment for npm to update
sleep 5

# Check if package is available on npm
if npm view "@opennode/forge@$CURRENT_VERSION" > /dev/null 2>&1; then
    print_success "Package verified on npm registry"
else
    print_warning "Package not yet available on npm registry (may take a few minutes)"
fi

# Final success message
echo ""
print_success "Publishing workflow completed!"
echo ""
echo "📦 Package: @opennode/forge@$CURRENT_VERSION"
echo "🔗 npm: https://www.npmjs.com/package/@opennode/forge"
echo "📚 Docs: https://github.com/opennode/opennode-forge#readme"
echo ""
print_status "Next steps:"
echo "  1. Test the published package: npm install -g @opennode/forge"
echo "  2. Verify CLI works: opennode --help"
echo "  3. Update documentation if needed"
echo "  4. Announce the release"
echo "" 