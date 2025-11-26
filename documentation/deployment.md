# Deployment Guide

## Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] Code builds successfully (`npm run build`)
- [ ] Tests pass (if implemented)
- [ ] No sensitive data in code or git history
- [ ] Dependencies up to date and audited (`npm audit`)

### Configuration

- [ ] Environment variables configured for production
- [ ] Strong JWT secrets generated (32+ bytes)
- [ ] Database connection string set (`DATABASE_URL`)
- [ ] `NODE_ENV=production`
- [ ] `COOKIE_SECURE=true`
- [ ] CORS origins restricted (no wildcard `*`)
- [ ] Port configured (default: 3000)

### Security

- [ ] Secrets stored in secure vault (not in code)
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection headers
- [ ] CSRF tokens (if using session cookies)

### Database

- [ ] Migrations applied (`npm run prisma:migrate:deploy`)
- [ ] Database backups configured
- [ ] Connection pooling optimized
- [ ] Indexes added for performance

### Monitoring

- [ ] Logging configured (structured logs)
- [ ] Error tracking (Sentry, Rollbar, etc.)
- [ ] Performance monitoring (APM)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Database monitoring

---

## Environment Configuration

### Production `.env`

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://username:password@host:5432/expenseit?schema=public"

# JWT Secrets (MUST be different from development)
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET="<strong-random-secret-32-bytes>"
JWT_REFRESH_SECRET="<different-strong-random-secret-32-bytes>"

# Token Expiry
ACCESS_TOKEN_EXP="15m"
REFRESH_TOKEN_EXP="7d"

# Cookie Security (MUST be true in production)
COOKIE_SECURE="true"

# CORS (set to your frontend URL, NOT wildcard *)
CLIENT_ORIGIN="https://your-frontend-domain.com"

# Optional: Logging
LOG_LEVEL="info"  # debug, info, warn, error
```

### Secret Management

**⚠️ Never commit secrets to git**

**Options**:

**1. Environment Variables** (simplest):

```bash
# Set in hosting platform dashboard
# AWS: Systems Manager Parameter Store
# Heroku: Config Vars
# Vercel: Environment Variables
# Railway: Variables
```

**2. Secret Management Services**:

- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault

**3. `.env` File** (for VPS/self-hosted):

```bash
# On server, create /etc/expenseit/.env
sudo nano /etc/expenseit/.env

# Restrict permissions
sudo chmod 600 /etc/expenseit/.env
sudo chown nodejs:nodejs /etc/expenseit/.env
```

---

## Database Migration

### PostgreSQL Setup

**1. Create Database**:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE expenseit;

# Create user (optional)
CREATE USER expenseit_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE expenseit TO expenseit_user;

# Exit
\q
```

**2. Set `DATABASE_URL`**:

```bash
DATABASE_URL="postgresql://expenseit_user:secure_password@localhost:5432/expenseit?schema=public"
```

**3. Apply Migrations**:

```bash
npm run prisma:migrate:deploy
```

**Note**: Use `prisma migrate deploy` (not `migrate dev`) in production. This skips interactive prompts and applies all pending migrations.

### Migration from SQLite to PostgreSQL

**Option 1: Fresh Start** (no data loss, only for new deploys):

```bash
# Set DATABASE_URL to PostgreSQL
DATABASE_URL="postgresql://..."

# Apply all migrations
npm run prisma:migrate:deploy
```

**Option 2: Data Export/Import**:

**Export from SQLite**:

```bash
sqlite3 prisma/dev.db .dump > data.sql
```

**Import to PostgreSQL** (requires manual adjustments):

```bash
# SQLite and PostgreSQL SQL syntax differs
# Manually edit data.sql to fix:
# - AUTOINCREMENT → SERIAL
# - INTEGER PRIMARY KEY → SERIAL PRIMARY KEY
# - DATETIME → TIMESTAMP

psql -U expenseit_user -d expenseit -f data.sql
```

**Option 3: Use Prisma Studio** (for small datasets):

1. Export data from SQLite database via Prisma Studio
2. Change `DATABASE_URL` to PostgreSQL
3. Run migrations
4. Manually re-create records via Prisma Studio or seed script

---

## Deployment Platforms

### Heroku

**1. Install Heroku CLI**:

```bash
npm install -g heroku
heroku login
```

**2. Create App**:

```bash
heroku create expenseit-api
```

**3. Add PostgreSQL**:

```bash
heroku addons:create heroku-postgresql:mini
# Automatically sets DATABASE_URL
```

**4. Set Environment Variables**:

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET="<your-secret>"
heroku config:set JWT_REFRESH_SECRET="<your-secret>"
heroku config:set COOKIE_SECURE="true"
heroku config:set CLIENT_ORIGIN="https://your-frontend.com"
```

**5. Deploy**:

```bash
git push heroku main
```

**6. Run Migrations**:

```bash
heroku run npm run prisma:migrate:deploy
```

**7. View Logs**:

```bash
heroku logs --tail
```

---

### Railway

**1. Install Railway CLI** (optional):

```bash
npm install -g @railway/cli
railway login
```

**2. Create Project** (or use web dashboard):

```bash
railway init
```

**3. Add PostgreSQL**:

- Dashboard → New → Database → PostgreSQL
- Copy connection string to `DATABASE_URL`

**4. Set Environment Variables**:

- Dashboard → Variables → Add all env vars from `.env`

**5. Deploy**:

```bash
# Option 1: GitHub integration (recommended)
# Connect repo in dashboard

# Option 2: CLI deploy
railway up
```

**6. Run Migrations**:

```bash
railway run npm run prisma:migrate:deploy
```

---

### Render

**1. Create Web Service**:

- Dashboard → New → Web Service
- Connect GitHub repository

**2. Configure**:

- **Build Command**: `npm install && npm run build && npm run prisma:generate`
- **Start Command**: `npm run prisma:migrate:deploy && npm start`
- **Environment**: Node
- **Instance Type**: Free (or paid for production)

**3. Add PostgreSQL**:

- Dashboard → New → PostgreSQL
- Copy Internal Database URL to `DATABASE_URL` in web service

**4. Set Environment Variables**:

- Web Service → Environment
- Add all env vars

**5. Deploy**:

- Automatic on git push

---

### AWS (EC2)

**1. Launch EC2 Instance**:

- Ubuntu 22.04 LTS
- t2.micro (free tier) or larger
- Security group: allow HTTP (80), HTTPS (443), SSH (22)

**2. Connect via SSH**:

```bash
ssh -i your-key.pem ubuntu@<instance-ip>
```

**3. Install Node.js**:

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v
npm -v
```

**4. Install PostgreSQL**:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE expenseit;
CREATE USER expenseit_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE expenseit TO expenseit_user;
\q
```

**5. Clone Repository**:

```bash
cd /var/www
sudo git clone https://github.com/your-repo/ExpenseIt-API.git
cd ExpenseIt-API
sudo chown -R ubuntu:ubuntu .
```

**6. Install Dependencies**:

```bash
npm install
```

**7. Configure Environment**:

```bash
sudo nano /etc/expenseit/.env
# Paste production env vars

sudo chmod 600 /etc/expenseit/.env
```

**8. Build**:

```bash
npm run build
```

**9. Run Migrations**:

```bash
npm run prisma:migrate:deploy
```

**10. Install PM2** (process manager):

```bash
sudo npm install -g pm2

# Start app
pm2 start dist/index.js --name expenseit-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

**11. Configure Nginx** (reverse proxy):

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/expenseit
```

Add:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/expenseit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**12. Install SSL Certificate** (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Docker

**Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npm run prisma:migrate:deploy && npm start"]
```

**docker-compose.yml**:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: expenseit
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: expenseit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://expenseit:secure_password@db:5432/expenseit
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      COOKIE_SECURE: "true"
      CLIENT_ORIGIN: ${CLIENT_ORIGIN}
    depends_on:
      - db

volumes:
  postgres_data:
```

**Deploy**:

```bash
docker-compose up -d
```

---

## HTTPS Setup

**Required for production** (secure cookies require HTTPS).

### Option 1: Let's Encrypt (Free)

**With Nginx** (see AWS section above):

```bash
sudo certbot --nginx -d api.yourdomain.com
```

**With Certbot Standalone**:

```bash
sudo certbot certonly --standalone -d api.yourdomain.com
```

### Option 2: CloudFlare

1. Add domain to CloudFlare
2. Set DNS record: `api.yourdomain.com` → `<server-ip>`
3. Enable "Full (strict)" SSL/TLS mode
4. CloudFlare handles HTTPS automatically

### Option 3: Platform-Managed

- **Heroku**: Automatic HTTPS on `*.herokuapp.com` domains
- **Railway**: Automatic HTTPS on `*.railway.app` domains
- **Render**: Automatic HTTPS on `*.onrender.com` domains
- **Vercel**: Automatic HTTPS on all deployments

---

## Performance Optimization

### Connection Pooling

Prisma automatically manages connection pooling. Configure limits:

```typescript
// prisma.config.ts or connection string
DATABASE_URL = "postgresql://user:pass@host:5432/db?connection_limit=10";
```

**Recommended limits**:

- **Development**: 5-10 connections
- **Production**: 20-50 connections (depends on instance size)

### Caching

**Consider Redis for**:

- Rate limiting
- Session storage
- Frequently accessed data

**Example** (Railway Redis):

```bash
# Add Redis in Railway dashboard
# Copy connection string

# Install redis client
npm install ioredis
```

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache user profile
await redis.setex(`user:${userId}`, 300, JSON.stringify(user)); // 5 min TTL
```

### Compression

```bash
npm install compression
```

```typescript
import compression from "compression";
app.use(compression());
```

### Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: "Too many requests, please try again later",
});

app.use("/api/", limiter);

// Stricter limits for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
```

---

## Monitoring & Logging

### Structured Logging

**Winston**:

```bash
npm install winston
```

```typescript
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "expenseit-api" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Usage
logger.info("User logged in", { userId: 1, email: "user@example.com" });
logger.error("Database error", { error: err.message, stack: err.stack });
```

### Error Tracking

**Sentry**:

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capture errors
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring

**Free Services**:

- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com (free tier)
- **Better Uptime**: https://betteruptime.com

**Setup**:

1. Create health check endpoint:

```typescript
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

2. Add URL to monitoring service: `https://api.yourdomain.com/health`

### Database Monitoring

**Tools**:

- **DataDog**: APM + database monitoring
- **New Relic**: Full-stack observability
- **Prisma Pulse**: Real-time database events (paid)

---

## Backup & Disaster Recovery

### Database Backups

**Automated** (PostgreSQL):

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U expenseit_user expenseit > /backups/expenseit_$DATE.sql

# Keep only last 7 days
find /backups -name "expenseit_*.sql" -mtime +7 -delete
```

**Schedule with cron**:

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

**Cloud Backups**:

- **Heroku Postgres**: `heroku pg:backups:schedule --at '02:00' DATABASE_URL`
- **Railway**: Automatic backups (paid plans)
- **AWS RDS**: Automated snapshots (configurable retention)

### Restore from Backup

```bash
# PostgreSQL
psql -U expenseit_user -d expenseit -f backup.sql

# Or create new database
psql -U postgres
CREATE DATABASE expenseit_restore;
\q

psql -U expenseit_user -d expenseit_restore -f backup.sql
```

### Code Backups

- **Git**: Primary version control (GitHub, GitLab, Bitbucket)
- **Mirror repos**: Consider GitLab mirror of GitHub repo
- **Local clones**: Keep local copies on multiple machines

---

## CI/CD Pipeline

### GitHub Actions

**`.github/workflows/deploy.yml`**:

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
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "expenseit-api"
          heroku_email: "your-email@example.com"
```

### GitLab CI

**`.gitlab-ci.yml`**:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  image: node:18
  script:
    - npm run prisma:migrate:deploy
    - pm2 restart expenseit-api
  only:
    - main
```

---

## Security Best Practices

### Environment Security

- [ ] Use strong secrets (32+ random bytes)
- [ ] Rotate secrets periodically (every 90 days)
- [ ] Use separate secrets for dev/staging/prod
- [ ] Store secrets in vault (not in code or env files in repo)
- [ ] Restrict access to production environment variables

### Application Security

- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set `COOKIE_SECURE=true` in production
- [ ] Use `httpOnly` cookies for refresh tokens
- [ ] Implement rate limiting
- [ ] Validate all inputs (add Zod validation)
- [ ] Sanitize error messages (don't expose stack traces)
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Implement CSRF protection for state-changing operations
- [ ] Add security headers (helmet.js)
- [ ] Keep dependencies up to date (`npm audit`)

**Helmet.js** (security headers):

```bash
npm install helmet
```

```typescript
import helmet from "helmet";
app.use(helmet());
```

### Database Security

- [ ] Use strong database passwords
- [ ] Restrict database access (IP whitelist, VPC)
- [ ] Use SSL/TLS for database connections
- [ ] Implement row-level security (PostgreSQL policies)
- [ ] Regular backups
- [ ] Monitor for suspicious queries

### Access Control

- [ ] Use least privilege principle (database users, IAM roles)
- [ ] Implement audit logging
- [ ] Monitor authentication attempts
- [ ] Add 2FA for admin accounts (future)

---

## Rollback Strategy

### Quick Rollback (Heroku)

```bash
# View releases
heroku releases

# Rollback to previous release
heroku rollback v123
```

### Manual Rollback (VPS)

```bash
# Keep previous build
cd /var/www/ExpenseIt-API
git fetch
git checkout <previous-commit-hash>

npm install
npm run build
npm run prisma:migrate:deploy

pm2 restart expenseit-api
```

### Database Rollback

**⚠️ Dangerous - test in staging first**

```bash
# Undo last migration (development only)
npx prisma migrate reset

# Production: restore from backup
psql -U expenseit_user -d expenseit -f backup.sql
```

---

## Post-Deployment

### Smoke Tests

```bash
# Health check
curl https://api.yourdomain.com/health

# Register test user
curl -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected endpoint
curl https://api.yourdomain.com/transactions \
  -H "Authorization: Bearer <token-from-login>"
```

### Monitoring Checklist

- [ ] Verify uptime monitor is active
- [ ] Check error tracking dashboard (Sentry)
- [ ] Review application logs
- [ ] Monitor database performance
- [ ] Check SSL certificate expiry (Let's Encrypt auto-renews)
- [ ] Review rate limiting effectiveness
- [ ] Monitor memory/CPU usage

---

## Troubleshooting

### "Cannot connect to database"

**Causes**:

- Wrong `DATABASE_URL`
- Database server not running
- Firewall blocking connection
- SSL/TLS required but not configured

**Solutions**:

```bash
# Test connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql

# Check firewall
sudo ufw status
sudo ufw allow 5432/tcp

# Add SSL to connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

### "Migration failed"

**Causes**:

- Database schema out of sync
- Migration conflicts
- Insufficient permissions

**Solutions**:

```bash
# Check migration status
npx prisma migrate status

# Resolve conflicts
npx prisma migrate resolve --applied <migration-name>

# Reset (⚠️ deletes data)
npx prisma migrate reset
```

### "Port already in use"

**Solutions**:

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or change port
PORT=3001 npm start
```

### "Out of memory"

**Solutions**:

- Increase instance size (more RAM)
- Add swap space (Linux)
- Optimize queries (reduce payload size)
- Implement pagination
- Add caching layer

---

## Scaling Strategies

### Vertical Scaling

- Upgrade instance size (more CPU/RAM)
- Upgrade database instance

### Horizontal Scaling

- Load balancer + multiple API instances
- Connection pooling (PgBouncer)
- Read replicas for database
- Separate caching layer (Redis)

### Microservices (future)

- Separate auth service
- Separate transaction service
- Event-driven architecture (message queues)

---

## Cost Optimization

### Free Tier Options

- **Render**: Free web service + PostgreSQL (sleep after inactivity)
- **Railway**: $5 credit/month (enough for small apps)
- **Heroku**: Eco dynos ($5/month, sleeps after 30 min)
- **Fly.io**: Free tier for small apps

### Cost Monitoring

- Monitor database size (storage costs)
- Review API request volume (compute costs)
- Optimize queries (reduce database load)
- Implement caching (reduce redundant queries)
- Use serverless for low-traffic apps (AWS Lambda, Vercel Functions)

---

## Support & Maintenance

### Regular Tasks

**Weekly**:

- Review error logs
- Check uptime reports
- Monitor database size

**Monthly**:

- Update dependencies (`npm update`)
- Review and rotate secrets
- Check SSL certificate expiry
- Review backup integrity

**Quarterly**:

- Security audit (`npm audit`)
- Performance review
- Capacity planning
- Cost optimization review

---

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Express Security**: https://expressjs.com/en/advanced/best-practice-security.html
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **PostgreSQL Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization
