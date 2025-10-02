# Production Database Deployment Guide

This guide covers setting up and deploying your PostgreSQL database in production environments.

## 🏗️ Database Hosting Options

### Self-Hosted PostgreSQL (Recommended for Cost Savings)

Since managed database services can be expensive, self-hosting PostgreSQL on your cloud server is a cost-effective alternative.

**Benefits of Self-Hosting:**

- Full control over database configuration
- Significantly lower costs (just the server cost)
- No vendor lock-in
- Custom backup and monitoring strategies

**Requirements:**

- Cloud server with sufficient resources (2GB+ RAM recommended)
- Proper security configuration
- Automated backup setup
- Monitoring and maintenance procedures

### Alternative: Managed Database Services

If you prefer managed services later:

1. **AWS RDS PostgreSQL** - ~$15-50/month for small instances
2. **Google Cloud SQL** - Similar features to RDS
3. **DigitalOcean Managed Databases** - ~$15/month
4. **Supabase** - Generous free tier, great developer experience

## 🐘 Self-Hosted PostgreSQL Setup

### 1. Install PostgreSQL on Your Server

**Ubuntu/Debian:**

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**

```bash
# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Configure PostgreSQL for Production

**Create application database and user:**

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE atomic_ambitions_prod;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE atomic_ambitions_prod TO app_user;

# Exit psql
\q
```

**Configure PostgreSQL for remote connections:**

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf

# Uncomment and modify:
listen_addresses = '*'
port = 5432
```

**Configure pg_hba.conf for authentication:**

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add line for your application:
host    atomic_ambitions_prod    app_user    0.0.0.0/0    md5
```

**Restart PostgreSQL:**

```bash
sudo systemctl restart postgresql
```

### 3. Security Configuration

**Firewall setup:**

```bash
# Allow PostgreSQL port (adjust for your firewall)
sudo ufw allow 5432/tcp

# Or for iptables:
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

**SSL Configuration (Recommended):**

```bash
# Generate SSL certificates
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=your-server-domain"

# Set proper permissions
sudo chmod 600 server.key
sudo chown postgres:postgres server.key server.crt

# Move to PostgreSQL data directory
sudo mv server.crt server.key /var/lib/postgresql/*/main/
```

### 4. Backup Configuration

**Create backup script:**

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

BACKUP_DIR="/opt/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="atomic_ambitions_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U app_user $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**Set up automated backups:**

```bash
# Make script executable
sudo chmod +x /opt/scripts/backup-db.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add this line:
0 2 * * * /opt/scripts/backup-db.sh
```

## 🔧 Environment Setup

### 1. Environment Variables

Create a `.env.production` file:

```bash
# Database Configuration (Self-hosted)
DATABASE_URL="postgresql://app_user:your_secure_password@your-server-ip:5432/atomic_ambitions_prod?sslmode=require&pool_size=10"

# Application Configuration
NODE_ENV="production"
API_HOST="0.0.0.0"
API_PORT=3000

# Optional: Additional database settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_TIMEOUT=30000
```

### 2. Connection String Format

```bash
# Self-hosted PostgreSQL format
postgresql://username:password@server-ip:5432/database?sslmode=require&pool_size=10

# Example for your setup:
postgresql://app_user:your_secure_password@192.168.1.100:5432/atomic_ambitions_prod?sslmode=require

# For IPv6 addresses (if needed):
postgresql://app_user:your_secure_password@[2001:db8::1]:5432/atomic_ambitions_prod?sslmode=require
```

### 3. Testing Database Connection

Before running migrations, test your database connection:

```bash
# Test connection from your application server
psql "postgresql://app_user:your_secure_password@your-server-ip:5432/atomic_ambitions_prod"

# Or test with your application
NODE_ENV=production pnpm run migrate:status
```

## 🚀 Deployment Strategies

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: pnpm run build

      - name: Run database migrations
        run: pnpm run migrate:prod:latest
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          NODE_ENV: production

      - name: Deploy to server
        run: |
          # Your deployment commands here
          # e.g., rsync, docker deploy, etc.
```

### Option 2: Manual Deployment

1. **Build and transfer code:**

   ```bash
   # Build locally
   pnpm run build

   # Create deployment package
   tar -czf deployment.tar.gz dist/ package.json pnpm-lock.yaml

   # Transfer to server
   scp deployment.tar.gz user@your-server:/path/to/app/
   ```

2. **On the server:**

   ```bash
   # Extract and install
   tar -xzf deployment.tar.gz
   pnpm install --production

   # Run migrations
   NODE_ENV=production pnpm run migrate:prod:latest

   # Start application
   pnpm start
   ```

### Option 3: Docker Deployment

Create `Dockerfile.production`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --production

# Copy built application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## 🔄 Migration Management

### Pre-deployment Checklist

- [ ] Test migrations on staging environment
- [ ] Create database backup
- [ ] Verify rollback procedures
- [ ] Check migration dependencies

### Running Migrations

```bash
# Check migration status
pnpm run migrate:status

# Run all pending migrations
pnpm run migrate:prod:latest

# Run one migration at a time (safer for production)
pnpm run migrate:prod:up

# Rollback last migration (use with caution)
pnpm run migrate:prod:down
```

### Migration Best Practices

1. **Always test migrations on staging first**
2. **Create backups before major migrations**
3. **Use transactions for data migrations**
4. **Avoid breaking changes in migrations**
5. **Document migration purposes**

## 🔒 Security Considerations

### Database Security

1. **Use SSL connections** (sslmode=require)
2. **Restrict database access** to application servers only
3. **Use strong passwords** and rotate them regularly
4. **Enable connection pooling** to prevent connection exhaustion
5. **Monitor database logs** for suspicious activity

### Environment Security

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** and database credentials regularly
4. **Use least-privilege access** for database users

## 📊 Monitoring & Maintenance

### Database Monitoring

1. **Connection pool status**
2. **Query performance**
3. **Disk space usage**
4. **Backup status**

### Health Checks

Add to your application:

```typescript
// Health check endpoint
app.get("/health", async (request, reply) => {
  try {
    // Test database connection
    await db.selectFrom("users").select("id").limit(1).execute();
    reply.send({ status: "healthy", database: "connected" });
  } catch (error) {
    reply.status(503).send({ status: "unhealthy", database: "disconnected" });
  }
});
```

## 🆘 Troubleshooting

### Common Issues

1. **Connection timeout**

   - Check network connectivity
   - Verify firewall settings
   - Increase connection timeout

2. **SSL certificate errors**

   - Ensure `sslmode=require` in connection string
   - Check certificate validity

3. **Migration failures**

   - Check database permissions
   - Verify migration file syntax
   - Review database logs

4. **IPv6 connectivity issues**
   - Use managed database services
   - Configure IPv4 fallback
   - Use connection pooling

### Recovery Procedures

1. **Database backup restoration**
2. **Migration rollback**
3. **Connection pool reset**
4. **Application restart**

## 📚 Additional Resources

- [Kysely Documentation](https://kysely.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Database Migration Strategies](https://martinfowler.com/articles/evodb.html)
