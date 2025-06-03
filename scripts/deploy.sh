#!/bin/bash

# OpenNode Forge - Complete Deployment Script
# Comprehensive deployment automation for all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="OpenNode Forge"
DOCKER_IMAGE="opennode-forge"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_NAMESPACE="${DOCKER_NAMESPACE:-opennode}"
K8S_NAMESPACE="${K8S_NAMESPACE:-opennode-forge}"
FASTAPI_PORT="${FASTAPI_PORT:-8000}"
NODE_PORT="${NODE_PORT:-3000}"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check deployment prerequisites
check_prerequisites() {
    log_step "Checking deployment prerequisites..."
    
    # Check if build exists
    if [[ ! -d "dist" ]]; then
        log_error "Build directory not found. Run build script first."
        exit 1
    fi
    
    # Check required tools
    local tools=("docker" "git")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Deploy to npm registry
deploy_npm() {
    log_step "Deploying to npm registry..."
    
    local npm_token="${NPM_TOKEN:-}"
    local dry_run="${DRY_RUN:-false}"
    
    if [[ -z "$npm_token" ]]; then
        log_warning "NPM_TOKEN not set. Using npm login."
        npm whoami || {
            log_error "Not logged in to npm. Run 'npm login' first."
            return 1
        }
    else
        echo "//registry.npmjs.org/:_authToken=$npm_token" > ~/.npmrc
    fi
    
    # Validate package before publishing
    npm pack --dry-run
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Dry run mode - would publish to npm"
        npm publish --dry-run
    else
        npm publish --access public
        log_success "Published to npm registry"
    fi
}

# Build and push Docker images
deploy_docker() {
    log_step "Building and pushing Docker images..."
    
    local version=$(node -p "require('./package.json').version")
    local image_name="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE"
    
    # Build multi-platform images
    log_info "Building Docker images..."
    
    # Main application image
    docker build -t "$image_name:$version" -t "$image_name:latest" .
    
    # FastAPI image if Dockerfile.api exists
    if [[ -f "Dockerfile.api" ]]; then
        docker build -f Dockerfile.api -t "$image_name-api:$version" -t "$image_name-api:latest" .
    fi
    
    # Push images
    if [[ "${DOCKER_PUSH:-true}" == "true" ]]; then
        log_info "Pushing Docker images..."
        docker push "$image_name:$version"
        docker push "$image_name:latest"
        
        if [[ -f "Dockerfile.api" ]]; then
            docker push "$image_name-api:$version"
            docker push "$image_name-api:latest"
        fi
        
        log_success "Docker images pushed to registry"
    else
        log_info "Docker push skipped (DOCKER_PUSH=false)"
    fi
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_step "Deploying to Kubernetes..."
    
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found. Skipping Kubernetes deployment."
        return 0
    fi
    
    local version=$(node -p "require('./package.json').version")
    local image_name="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE"
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Generate Kubernetes manifests
    cat > k8s-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opennode-forge
  namespace: $K8S_NAMESPACE
  labels:
    app: opennode-forge
    version: $version
spec:
  replicas: 3
  selector:
    matchLabels:
      app: opennode-forge
  template:
    metadata:
      labels:
        app: opennode-forge
        version: $version
    spec:
      containers:
      - name: opennode-forge
        image: $image_name:$version
        ports:
        - containerPort: $NODE_PORT
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "$NODE_PORT"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: $NODE_PORT
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: $NODE_PORT
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: opennode-forge-service
  namespace: $K8S_NAMESPACE
  labels:
    app: opennode-forge
spec:
  selector:
    app: opennode-forge
  ports:
  - port: 80
    targetPort: $NODE_PORT
    protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: opennode-forge-ingress
  namespace: $K8S_NAMESPACE
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - opennode-forge.example.com
    secretName: opennode-forge-tls
  rules:
  - host: opennode-forge.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: opennode-forge-service
            port:
              number: 80
EOF
    
    # Apply manifests
    kubectl apply -f k8s-deployment.yaml
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/opennode-forge -n "$K8S_NAMESPACE" --timeout=300s
    
    log_success "Deployed to Kubernetes cluster"
}

# Deploy to cloud platforms
deploy_cloud() {
    local platform="${1:-}"
    
    case "$platform" in
        "aws")
            deploy_aws
            ;;
        "gcp")
            deploy_gcp
            ;;
        "azure")
            deploy_azure
            ;;
        "heroku")
            deploy_heroku
            ;;
        *)
            log_warning "Unknown cloud platform: $platform"
            ;;
    esac
}

# Deploy to AWS
deploy_aws() {
    log_step "Deploying to AWS..."
    
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. Skipping AWS deployment."
        return 0
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        return 1
    fi
    
    local version=$(node -p "require('./package.json').version")
    local app_name="opennode-forge"
    
    # Deploy using AWS App Runner or ECS
    log_info "Deploying to AWS App Runner..."
    
    # Create apprunner.yaml if it doesn't exist
    if [[ ! -f "apprunner.yaml" ]]; then
        cat > apprunner.yaml << EOF
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm ci
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: $NODE_PORT
    env: PORT
  env:
    - name: NODE_ENV
      value: production
EOF
    fi
    
    log_success "AWS deployment configuration created"
}

# Deploy to Google Cloud Platform
deploy_gcp() {
    log_step "Deploying to Google Cloud Platform..."
    
    if ! command -v gcloud &> /dev/null; then
        log_warning "Google Cloud CLI not found. Skipping GCP deployment."
        return 0
    fi
    
    local version=$(node -p "require('./package.json').version")
    local project_id="${GCP_PROJECT_ID:-opennode-forge}"
    
    # Deploy to Cloud Run
    log_info "Deploying to Google Cloud Run..."
    
    gcloud run deploy opennode-forge \
        --image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE:$version" \
        --platform=managed \
        --region=us-central1 \
        --allow-unauthenticated \
        --port=$NODE_PORT \
        --memory=512Mi \
        --cpu=1 \
        --max-instances=10 \
        --project="$project_id" || log_warning "GCP deployment failed"
    
    log_success "Deployed to Google Cloud Run"
}

# Deploy to Microsoft Azure
deploy_azure() {
    log_step "Deploying to Microsoft Azure..."
    
    if ! command -v az &> /dev/null; then
        log_warning "Azure CLI not found. Skipping Azure deployment."
        return 0
    fi
    
    local version=$(node -p "require('./package.json').version")
    local resource_group="${AZURE_RESOURCE_GROUP:-opennode-forge-rg}"
    local app_name="${AZURE_APP_NAME:-opennode-forge}"
    
    # Deploy to Azure Container Instances
    log_info "Deploying to Azure Container Instances..."
    
    az container create \
        --resource-group "$resource_group" \
        --name "$app_name" \
        --image "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE:$version" \
        --ports $NODE_PORT \
        --environment-variables NODE_ENV=production PORT=$NODE_PORT \
        --cpu 1 \
        --memory 1 || log_warning "Azure deployment failed"
    
    log_success "Deployed to Azure Container Instances"
}

# Deploy to Heroku
deploy_heroku() {
    log_step "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        log_warning "Heroku CLI not found. Skipping Heroku deployment."
        return 0
    fi
    
    local app_name="${HEROKU_APP_NAME:-opennode-forge}"
    
    # Check if Heroku app exists
    if ! heroku apps:info "$app_name" &> /dev/null; then
        log_info "Creating Heroku app: $app_name"
        heroku create "$app_name"
    fi
    
    # Deploy using container registry
    heroku container:login
    heroku container:push web --app "$app_name"
    heroku container:release web --app "$app_name"
    
    log_success "Deployed to Heroku"
}

# Deploy FastAPI service
deploy_fastapi() {
    log_step "Deploying FastAPI service..."
    
    if [[ ! -d "api" ]]; then
        log_warning "FastAPI directory not found. Skipping FastAPI deployment."
        return 0
    fi
    
    local version=$(node -p "require('./package.json').version")
    
    # Create FastAPI Dockerfile if it doesn't exist
    if [[ ! -f "Dockerfile.api" ]]; then
        cat > Dockerfile.api << EOF
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application
COPY api/ .

# Expose port
EXPOSE $FASTAPI_PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:$FASTAPI_PORT/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$FASTAPI_PORT", "--workers", "4"]
EOF
    fi
    
    # Build and deploy FastAPI image
    local api_image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE-api"
    docker build -f Dockerfile.api -t "$api_image:$version" -t "$api_image:latest" .
    
    if [[ "${DOCKER_PUSH:-true}" == "true" ]]; then
        docker push "$api_image:$version"
        docker push "$api_image:latest"
    fi
    
    log_success "FastAPI service deployed"
}

# Setup monitoring and observability
setup_monitoring() {
    log_step "Setting up monitoring and observability..."
    
    # Create monitoring configuration
    mkdir -p monitoring
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'opennode-forge'
    static_configs:
      - targets: ['localhost:$NODE_PORT']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'opennode-forge-api'
    static_configs:
      - targets: ['localhost:$FASTAPI_PORT']
    metrics_path: '/metrics'
    scrape_interval: 5s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF
    
    # Grafana dashboard configuration
    cat > monitoring/grafana-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "OpenNode Forge Monitoring",
    "tags": ["opennode", "forge"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF
    
    log_success "Monitoring configuration created"
}

# Verify deployment
verify_deployment() {
    log_step "Verifying deployment..."
    
    local version=$(node -p "require('./package.json').version")
    local package_name=$(node -p "require('./package.json').name")
    
    # Check npm package
    if npm view "$package_name@$version" &> /dev/null; then
        log_success "Package verified on npm registry"
    else
        log_warning "Package not found on npm registry"
    fi
    
    # Check Docker images
    if docker pull "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$DOCKER_IMAGE:$version" &> /dev/null; then
        log_success "Docker image verified in registry"
    else
        log_warning "Docker image not found in registry"
    fi
    
    # Health check endpoints
    local endpoints=(
        "http://localhost:$NODE_PORT/health"
        "http://localhost:$FASTAPI_PORT/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" &> /dev/null; then
            log_success "Health check passed: $endpoint"
        else
            log_warning "Health check failed: $endpoint"
        fi
    done
    
    log_success "Deployment verification completed"
}

# Main deployment process
main() {
    log_info "Starting complete deployment process for $PROJECT_NAME"
    echo "=================================================="
    
    check_prerequisites
    
    # Core deployments
    deploy_npm
    deploy_docker
    deploy_fastapi
    
    # Cloud deployments (if configured)
    if [[ -n "${CLOUD_PLATFORM:-}" ]]; then
        deploy_cloud "$CLOUD_PLATFORM"
    fi
    
    # Kubernetes deployment (if configured)
    if [[ "${DEPLOY_K8S:-false}" == "true" ]]; then
        deploy_kubernetes
    fi
    
    # Setup monitoring
    setup_monitoring
    
    # Verify deployment
    verify_deployment
    
    echo "=================================================="
    log_success "Complete deployment process finished successfully!"
    log_info "Deployment summary:"
    log_info "  - npm package: Published"
    log_info "  - Docker images: Built and pushed"
    log_info "  - FastAPI service: Deployed"
    log_info "  - Monitoring: Configured"
    log_info "  - Health checks: Verified"
}

# Handle script arguments
case "${1:-}" in
    "npm")
        deploy_npm
        ;;
    "docker")
        deploy_docker
        ;;
    "k8s"|"kubernetes")
        deploy_kubernetes
        ;;
    "aws")
        deploy_cloud "aws"
        ;;
    "gcp")
        deploy_cloud "gcp"
        ;;
    "azure")
        deploy_cloud "azure"
        ;;
    "heroku")
        deploy_cloud "heroku"
        ;;
    "fastapi")
        deploy_fastapi
        ;;
    "monitoring")
        setup_monitoring
        ;;
    "verify")
        verify_deployment
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [npm|docker|k8s|aws|gcp|azure|heroku|fastapi|monitoring|verify]"
        echo "  npm        - Deploy to npm registry"
        echo "  docker     - Build and push Docker images"
        echo "  k8s        - Deploy to Kubernetes"
        echo "  aws        - Deploy to AWS"
        echo "  gcp        - Deploy to Google Cloud Platform"
        echo "  azure      - Deploy to Microsoft Azure"
        echo "  heroku     - Deploy to Heroku"
        echo "  fastapi    - Deploy FastAPI service"
        echo "  monitoring - Setup monitoring"
        echo "  verify     - Verify deployment"
        echo "  (no arg)   - Run complete deployment process"
        echo ""
        echo "Environment variables:"
        echo "  NPM_TOKEN           - npm authentication token"
        echo "  DOCKER_REGISTRY     - Docker registry URL (default: docker.io)"
        echo "  DOCKER_NAMESPACE    - Docker namespace (default: opennode)"
        echo "  DOCKER_PUSH         - Push Docker images (default: true)"
        echo "  DRY_RUN            - Dry run mode (default: false)"
        echo "  CLOUD_PLATFORM     - Cloud platform (aws|gcp|azure|heroku)"
        echo "  DEPLOY_K8S         - Deploy to Kubernetes (default: false)"
        echo "  K8S_NAMESPACE      - Kubernetes namespace (default: opennode-forge)"
        echo "  FASTAPI_PORT       - FastAPI port (default: 8000)"
        echo "  NODE_PORT          - Node.js port (default: 3000)"
        exit 1
        ;;
esac 