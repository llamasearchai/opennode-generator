# OpenNode Forge Deployment Guide 🚀

This guide covers comprehensive deployment scenarios for the OpenNode Forge platform, from development to enterprise production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Monitoring Setup](#monitoring-setup)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

#### Minimum Requirements

- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB
- **Storage**: 20GB available space
- **OS**: Linux (Ubuntu 20.04+), macOS (11+), Windows 10+

#### Recommended Requirements

- **CPU**: 4+ cores, 3.0GHz+
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Linux (Ubuntu 22.04 LTS)

#### Production Requirements

- **CPU**: 8+ cores, 3.5GHz+
- **RAM**: 16GB+
- **Storage**: 100GB+ NVMe SSD
- **Network**: 1Gbps+

### Software Dependencies

```bash
# Core dependencies
Node.js >= 20.x
Python >= 3.11
Docker >= 24.x
Docker Compose >= 2.x

# Optional (for Kubernetes)
kubectl >= 1.28
Helm >= 3.x

# Optional (for monitoring)
Prometheus
Grafana
ElasticSearch
Kibana
```

## 🚀 Development Setup

### Local Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/your-org/opennode-forge.git
cd opennode-forge

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Initialize the database (if using PostgreSQL)
docker run --name opennode-postgres \
  -e POSTGRES_USER=opennode \
  -e POSTGRES_PASSWORD=opennode_password \
  -e POSTGRES_DB=opennode \
  -p 5432:5432 -d postgres:15-alpine

# 6. Start Redis cache
docker run --name opennode-redis \
  -p 6379:6379 -d redis:7-alpine

# 7. Build the project
npm run build

# 8. Run tests
npm test

# 9. Start development servers
npm run dev  # Starts Node.js CLI server
cd api && uvicorn main:app --reload --port 8000  # Start FastAPI
```

### Environment Configuration

Create `.env` file with the following configuration:

```bash
# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
API_PORT=8000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4000

# Database Configuration
DATABASE_URL=postgresql://opennode:opennode_password@localhost:5432/opennode
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# Feature Flags
ENABLE_AI_AGENTS=true
ENABLE_ULTRA_THINK=true
ENABLE_SECURITY_SCANNING=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_COLLABORATION_MODE=true
```

## 🏭 Production Deployment

### Manual Production Setup

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER opennode WITH PASSWORD 'secure_password_here';
CREATE DATABASE opennode OWNER opennode;
GRANT ALL PRIVILEGES ON DATABASE opennode TO opennode;
\q
EOF

# Configure Redis
sudo nano /etc/redis/redis.conf
# Add: requirepass your_redis_password_here
sudo systemctl restart redis-server
```

#### 3. Application Deployment

```bash
# Create application user
sudo useradd -m -s /bin/bash opennode

# Clone and setup application
sudo -u opennode git clone https://github.com/your-org/opennode-forge.git /home/opennode/app
cd /home/opennode/app

# Install dependencies
sudo -u opennode npm ci --only=production
cd api
sudo -u opennode python3 -m venv venv
sudo -u opennode ./venv/bin/pip install -r requirements.txt
cd ..

# Build application
sudo -u opennode npm run build

# Set up environment
sudo -u opennode cp .env.example .env
sudo -u opennode nano .env  # Configure production settings

# Set up systemd services
sudo cp deployment/systemd/opennode-api.service /etc/systemd/system/
sudo cp deployment/systemd/opennode-cli.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable opennode-api opennode-cli
sudo systemctl start opennode-api opennode-cli
```

#### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/opennode-forge
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # CLI server
    location /cli/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

## 🐳 Docker Deployment

### Single Container Deployment

```bash
# Build the image
docker build -t opennode-forge:latest .

# Run the container
docker run -d \
  --name opennode-forge \
  -p 3000:3000 \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_api_key \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379 \
  -v $(pwd)/output:/app/output \
  opennode-forge:latest
```

### Docker Compose Deployment

#### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  opennode-forge:
    build:
      context: .
      dockerfile: Dockerfile.comprehensive
    container_name: opennode-forge-prod
    restart: unless-stopped
    ports:
      - '3000:3000'
      - '8000:8000'
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://opennode:${POSTGRES_PASSWORD}@postgres:5432/opennode
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./output:/app/output
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: opennode-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: opennode
      POSTGRES_USER: opennode
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-prod-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U opennode -d opennode']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: opennode-redis-prod
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test:
        [
          'CMD',
          'redis-cli',
          '--no-auth-warning',
          '-a',
          '${REDIS_PASSWORD}',
          'ping',
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: opennode-nginx-prod
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - opennode-forge

volumes:
  postgres_data:
  redis_data:
```

#### Deployment Commands

```bash
# Production deployment
cp .env.example .env.prod
# Edit .env.prod with production values

# Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale opennode-forge=3

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# View logs
docker-compose -f docker-compose.prod.yml logs -f opennode-forge

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U opennode opennode > backup-$(date +%Y%m%d).sql
```

## ☸️ Kubernetes Deployment

### Basic Kubernetes Manifests

#### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: opennode-forge
  labels:
    app.kubernetes.io/name: opennode-forge
```

#### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: opennode-config
  namespace: opennode-forge
data:
  NODE_ENV: 'production'
  LOG_LEVEL: 'info'
  PORT: '3000'
  API_PORT: '8000'
  DATABASE_URL: 'postgresql://opennode:password@postgres:5432/opennode'
  REDIS_URL: 'redis://redis:6379'
```

#### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: opennode-secrets
  namespace: opennode-forge
type: Opaque
data:
  openai-api-key: <base64-encoded-api-key>
  jwt-secret: <base64-encoded-jwt-secret>
  postgres-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
```

#### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opennode-forge
  namespace: opennode-forge
  labels:
    app: opennode-forge
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: opennode-forge
  template:
    metadata:
      labels:
        app: opennode-forge
    spec:
      containers:
        - name: opennode-forge
          image: opennode-forge:latest
          ports:
            - containerPort: 3000
              name: cli
            - containerPort: 8000
              name: api
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: opennode-secrets
                  key: openai-api-key
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: opennode-secrets
                  key: jwt-secret
          envFrom:
            - configMapRef:
                name: opennode-config
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: output-volume
              mountPath: /app/output
      volumes:
        - name: output-volume
          persistentVolumeClaim:
            claimName: opennode-pvc
```

#### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: opennode-service
  namespace: opennode-forge
spec:
  selector:
    app: opennode-forge
  ports:
    - name: cli
      port: 3000
      targetPort: 3000
    - name: api
      port: 8000
      targetPort: 8000
  type: ClusterIP
```

#### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: opennode-ingress
  namespace: opennode-forge
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
    nginx.ingress.kubernetes.io/rate-limit-window: '1m'
spec:
  tls:
    - hosts:
        - api.opennode-forge.com
      secretName: opennode-tls
  rules:
    - host: api.opennode-forge.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: opennode-service
                port:
                  number: 8000
          - path: /cli
            pathType: Prefix
            backend:
              service:
                name: opennode-service
                port:
                  number: 3000
```

### Helm Deployment

```bash
# Install with Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL
helm install postgres bitnami/postgresql \
  --namespace opennode-forge \
  --create-namespace \
  --set auth.postgresPassword=secure_password \
  --set auth.database=opennode

# Install Redis
helm install redis bitnami/redis \
  --namespace opennode-forge \
  --set auth.password=secure_password

# Deploy OpenNode Forge
helm install opennode-forge ./helm/opennode-forge \
  --namespace opennode-forge \
  --values helm/values.prod.yaml
```

## ☁️ Cloud Deployments

### AWS ECS Deployment

```json
{
  "family": "opennode-forge",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "opennode-forge",
      "image": "your-account.dkr.ecr.region.amazonaws.com/opennode-forge:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/opennode"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:opennode/openai-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/opennode-forge",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: opennode-forge
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/cpu-throttling: 'false'
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: gcr.io/project-id/opennode-forge:latest
          ports:
            - containerPort: 8000
          env:
            - name: NODE_ENV
              value: production
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: openai-secret
                  key: api-key
          resources:
            limits:
              cpu: 2000m
              memory: 4Gi
```

### Azure Container Instances

```json
{
  "apiVersion": "2021-09-01",
  "type": "Microsoft.ContainerInstance/containerGroups",
  "name": "opennode-forge",
  "location": "eastus",
  "properties": {
    "osType": "Linux",
    "restartPolicy": "Always",
    "containers": [
      {
        "name": "opennode-forge",
        "properties": {
          "image": "your-registry.azurecr.io/opennode-forge:latest",
          "ports": [{ "port": 8000, "protocol": "TCP" }],
          "environmentVariables": [
            { "name": "NODE_ENV", "value": "production" }
          ],
          "resources": {
            "requests": {
              "cpu": 1,
              "memoryInGB": 2
            }
          }
        }
      }
    ],
    "ipAddress": {
      "type": "Public",
      "ports": [{ "port": 8000, "protocol": "TCP" }]
    }
  }
}
```

## 📊 Monitoring Setup

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert_rules.yml'

scrape_configs:
  - job_name: 'opennode-forge'
    static_configs:
      - targets: ['opennode-forge:9090']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "OpenNode Forge Monitoring",
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
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Application-specific ports
sudo ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis
```

### Security Headers

```nginx
# Security headers for Nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## ⚡ Performance Optimization

### Application Performance

```bash
# Node.js optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# CPU optimization
export UV_THREADPOOL_SIZE=16

# Enable clustering
export CLUSTER_WORKERS=4
```

### Database Optimization

```sql
-- PostgreSQL optimizations
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### Redis Optimization

```bash
# Redis optimizations
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
sysctl -p
```

## 🐛 Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory usage
docker stats
kubectl top pods

# Solutions:
# 1. Increase memory limits
# 2. Enable memory profiling
# 3. Check for memory leaks
```

#### Database Connection Issues

```bash
# Check database connectivity
pg_isready -h localhost -p 5432

# Common solutions:
# 1. Check connection string
# 2. Verify firewall rules
# 3. Check PostgreSQL logs
```

#### API Timeouts

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/health"

# Solutions:
# 1. Increase timeout values
# 2. Enable connection pooling
# 3. Scale horizontally
```

### Health Checks

```bash
# Application health
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/health/db

# Redis health
curl http://localhost:8000/health/redis

# Complete system health
curl http://localhost:8000/health/system
```

### Log Analysis

```bash
# Application logs
docker logs opennode-forge

# Database logs
docker logs opennode-postgres

# System logs
journalctl -u opennode-api -f
```

## 📞 Support

For deployment support:

- 📧 Email: deployment@opennode-forge.com
- 💬 Discord: [#deployment channel](https://discord.gg/opennode-forge)
- 📖 Wiki: [Deployment Documentation](https://github.com/your-org/opennode-forge/wiki/deployment)

---

This deployment guide provides comprehensive coverage for all deployment scenarios. Choose the method that best fits your infrastructure and requirements.
