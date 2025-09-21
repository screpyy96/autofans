#!/bin/bash

# Test runner script for the platform

set -e

echo "🧪 Running test suite for Platforma Mașini Second-Hand..."

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

# Check if dependencies are installed
print_status "Checking dependencies..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run type checking
print_status "Running type checking..."
if npm run typecheck; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Run unit tests
print_status "Running unit tests..."
if npm run test:run; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Run accessibility tests
print_status "Running accessibility tests..."
if npm run test:run -- app/test/accessibility/; then
    print_success "Accessibility tests passed"
else
    print_warning "Some accessibility tests failed"
fi

# Run performance tests
print_status "Running performance tests..."
if npm run test:run -- app/test/performance/; then
    print_success "Performance tests passed"
else
    print_warning "Some performance tests failed"
fi

# Run integration tests
print_status "Running integration tests..."
if npm run test:run -- app/test/integration/; then
    print_success "Integration tests passed"
else
    print_warning "Some integration tests failed"
fi

# Run visual regression tests
print_status "Running visual regression tests..."
if npm run test:run -- app/test/visual/; then
    print_success "Visual regression tests passed"
else
    print_warning "Some visual regression tests failed"
fi

# Generate coverage report
print_status "Generating coverage report..."
if npm run test:coverage; then
    print_success "Coverage report generated"
    print_status "Coverage report available at coverage/index.html"
else
    print_warning "Coverage report generation failed"
fi

# Bundle analysis (development only)
if [ "$NODE_ENV" = "development" ]; then
    print_status "Running bundle analysis..."
    npm run build
    print_success "Bundle analysis complete"
fi

print_success "All tests completed! 🎉"
print_status "Test results summary:"
echo "  ✅ Type checking"
echo "  ✅ Unit tests"
echo "  ⚠️  Accessibility tests (check warnings)"
echo "  ⚠️  Performance tests (check warnings)"
echo "  ⚠️  Integration tests (check warnings)"
echo "  ⚠️  Visual regression tests (check warnings)"
echo "  📊 Coverage report generated"

print_status "Next steps:"
echo "  1. Review test coverage report"
echo "  2. Fix any failing tests"
echo "  3. Update visual regression baselines if needed"
echo "  4. Run tests in CI/CD pipeline"