# Consensus.AI Deployment Guide

## Overview

This guide covers deploying Consensus.AI using Docker Compose for local development and production environments. The stack includes:

- **Frontend**: React application with Vite
- **Backend**: Node.js API with Express
- **Database**: MongoDB for data persistence
- **Cache**: Redis for session management
- **Proxy**: Nginx for load balancing and SSL

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificates (for production)
- Environment variables configured

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/consensus-ai.git
cd consensus-ai
```

### 2. Environment Variables

Create environment files for each environment:

#### Development (.env.development)

```env
# Database
MONGODB_URI=mongodb://consensus-mongo:27017/consensus-ai-dev
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password

# Cache
REDIS_PASSWORD=your-redis-password

# Backend
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-development

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# LLM APIs
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Production (.env.production)

```env
# Database
MONGODB_URI=mongodb://consensus-mongo:27017/consensus-ai
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-very-secure-password

# Cache
REDIS_PASSWORD=your-very-secure-redis-password

# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-production-different-from-dev

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# LLM APIs
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email (Production SMTP)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-secure-smtp-password

# Rate Limiting (More restrictive)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

## Development Deployment

### 1. Start Services

```bash
# Copy environment file
cp .env.development .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Initialize Database

```bash
# Run database migrations (if any)
docker-compose exec backend npm run migrate

# Seed initial data
docker-compose exec backend npm run seed
```

### 3. Setup Stripe

```bash
# Run Stripe setup script
docker-compose exec backend npm run setup-stripe
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MongoDB: localhost:27017
- Redis: localhost:6379

## Production Deployment

### 1. Server Setup

#### System Requirements

- 4+ CPU cores
- 8+ GB RAM
- 100+ GB SSD storage
- Ubuntu 20.04+ or similar

#### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p ./deployment/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./deployment/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./deployment/ssl/key.pem
sudo chown -R $USER:$USER ./deployment/ssl
```

#### Option B: Self-Signed (Development Only)

```bash
mkdir -p ./deployment/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./deployment/ssl/key.pem \
  -out ./deployment/ssl/cert.pem \
  -subj "/CN=your-domain.com"
```

### 3. Production Configuration

#### Update Nginx Configuration

Edit `deployment/nginx.conf`:

```nginx
server_name your-actual-domain.com;
```

#### Update Docker Compose Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    restart: unless-stopped
    environment:
      - NODE_ENV=production

  mongodb:
    restart: unless-stopped
    volumes:
      - /var/lib/mongodb:/data/db

  redis:
    restart: unless-stopped
    volumes:
      - /var/lib/redis:/data

  nginx:
    restart: unless-stopped
```

### 4. Deploy Application

```bash
# Copy production environment
cp .env.production .env

# Pull latest images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Initialize database
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# Setup Stripe
docker-compose exec backend npm run setup-stripe
```

### 5. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Health check endpoint
curl https://your-domain.com/health
```

### 2. Backup Strategy

#### Database Backup

```bash
# Create backup script
cat > backup-mongodb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

docker-compose exec -T mongodb mongodump \
  --host localhost:27017 \
  --db consensus-ai \
  --gzip \
  --archive > $BACKUP_DIR/backup_$DATE.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.gz" -mtime +7 -delete
EOF

chmod +x backup-mongodb.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /path/to/backup-mongodb.sh" | crontab -
```

#### Application Backup

```bash
# Backup application files
tar -czf consensus-ai-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  .
```

### 3. Log Management

```bash
# View logs
docker-compose logs -f --tail=100

# Configure log rotation
cat > /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=1M
  missingok
  delaycompress
  copytruncate
}
EOF
```

### 4. Performance Monitoring

#### Install monitoring tools

```bash
# Install Prometheus and Grafana (optional)
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

#### Basic monitoring script

```bash
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
df -h
free -h
echo "=== Docker Stats ==="
docker stats --no-stream
echo "=== Service Status ==="
docker-compose ps
EOF

chmod +x monitor.sh
```

## Scaling and Optimization

### 1. Database Optimization

```javascript
// Create database indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.consensusAnalyses.createIndex({ userId: 1, createdAt: -1 })
db.tokenUsage.createIndex({ userId: 1, date: -1 })
```

### 2. Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
    
  nginx:
    depends_on:
      - backend
```

### 3. CDN Setup

Configure CloudFlare or AWS CloudFront for static assets:

```nginx
# In nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    # Add CDN headers
}
```

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check compose file syntax
docker-compose config

# Check logs
docker-compose logs
```

#### Database Connection Issues

```bash
# Check MongoDB status
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Check network connectivity
docker-compose exec backend ping mongodb
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ./deployment/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check application metrics
curl https://your-domain.com/api/health

# Monitor database performance
docker-compose exec mongodb mongo --eval "db.runCommand({serverStatus: 1})"
```

## Security Checklist

- [ ] Environment variables secured
- [ ] SSL certificates configured
- [ ] Firewall rules applied
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Logs properly configured
- [ ] Backups automated
- [ ] Monitoring alerts set up

## Support

For deployment support:
- Documentation: https://docs.consensus-ai.com
- Issues: https://github.com/your-org/consensus-ai/issues
- Support: support@consensus-ai.com 