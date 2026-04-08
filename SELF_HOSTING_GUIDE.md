# MOA System - Self-Hosted Deployment Guide

This guide will help you self-host the MOA System on your own infrastructure and make it accessible through the internet.

## Overview

Instead of using cloud services, you'll:
- Run PostgreSQL database on your server
- Run Node.js backend on your server
- Run frontend on your server
- Access it through the internet via your IP or domain

---

## Architecture

```
Your Computer/Server
├── PostgreSQL (Database)
├── Node.js Express (Backend API on :5000)
├── Nginx or Apache (Reverse Proxy & Frontend on :80/:443)
└── Internet Access (via port forwarding or VPS)
```

---

## Option 1: Self-Host on Your Personal Computer (Local Network)

### Best For
- Small team
- Internal use only
- Development/testing
- Learning

### Requirements
- Windows/Mac/Linux computer
- Keep it running 24/7
- Port forwarding on router
- Internet connection

### Setup Steps

#### Step 1: Install PostgreSQL

**Windows:**
1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer
3. Set password for `postgres` user
4. Note the port (usually 5432)

**Mac:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

#### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE moa_system;

# Create user
CREATE USER moa_user WITH PASSWORD 'your-secure-password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE moa_system TO moa_user;

# Exit
\q
```

#### Step 3: Run Migration

```bash
# Connect to the database
psql -U moa_user -d moa_system -f database.sql
```

#### Step 4: Configure Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env
```

Set these values:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://moa_user:your-secure-password@localhost:5432/moa_system
JWT_SECRET=generate-a-random-secret-key-here
FRONTEND_URL=http://your-ip-or-domain.com
```

#### Step 5: Install & Start Backend

```bash
npm install
npm start
```

Backend runs on `http://localhost:5000`

#### Step 6: Build Frontend

```bash
cd frontend

# Create .env.local
echo "VITE_API_URL=http://your-ip-or-domain.com/api" > .env.local

# Build
npm install
npm run build
```

Output in `frontend/dist/`

#### Step 7: Set Up Nginx (Reverse Proxy)

**Install Nginx:**

Windows: Download from [nginx.org](https://nginx.org/en/download.html)
Mac: `brew install nginx`
Linux: `sudo apt install nginx`

**Configure Nginx:**

Create/edit `nginx.conf`:

```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name your-ip-or-domain;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Start Nginx:**
```bash
nginx
# Or on Windows: start nginx
```

#### Step 8: Port Forwarding (Make it Internet Accessible)

On your router:
1. Log in to router admin panel
2. Find Port Forwarding section
3. Forward port 80/443 to your computer's local IP
4. Get your public IP from [whatismyip.com](https://whatismyip.com)

#### Step 9: Configure Frontend

Edit `frontend/.env.local`:
```
VITE_API_URL=http://your-public-ip:80/api
```

Or use your domain if you have one.

---

## Option 2: Self-Host on a VPS (Recommended for Production)

### Best For
- Production deployment
- Always available
- Professional setup
- Team access

### Recommended Providers
- DigitalOcean ($4-6/month)
- Linode ($5/month)
- AWS Lightsail ($3.50/month)
- Vultr ($2.50/month)
- Hetzner ($3/month)

### Setup Steps

#### Step 1: Rent VPS

1. Choose provider (DigitalOcean example)
2. Create new droplet
3. Select Ubuntu 22.04 LTS
4. Choose cheapest size (1GB RAM, 1vCPU is enough)
5. Select region closest to you
6. SSH into server

#### Step 2: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create non-root user
sudo adduser moa
sudo usermod -aG sudo moa
su - moa

# Set up SSH key (recommended)
# On local computer:
# ssh-keygen -t ed25519
# Copy public key to server ~/.ssh/authorized_keys
```

#### Step 3: Install Required Software

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 4: Clone Your Code

```bash
git clone https://github.com/YOUR_USERNAME/moa-system.git
cd moa-system
```

#### Step 5: Set Up Database

```bash
sudo -u postgres psql

# In psql:
CREATE DATABASE moa_system;
CREATE USER moa_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE moa_system TO moa_user;
\q

# Run migrations
psql -U moa_user -d moa_system -f database.sql
```

#### Step 6: Configure Backend

```bash
cd backend
cp .env.example .env
nano .env
```

Set:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://moa_user:password@localhost:5432/moa_system
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com
```

#### Step 7: Start Backend (with PM2)

```bash
# Install PM2
sudo npm install -g pm2

# Start backend
cd ~/moa-system/backend
npm install
pm2 start server.js --name moa-backend

# Make it start on reboot
pm2 startup
pm2 save
```

#### Step 8: Build Frontend

```bash
cd ~/moa-system/frontend
echo "VITE_API_URL=https://your-domain.com/api" > .env.local
npm install
npm run build
```

#### Step 9: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/moa
```

Paste:
```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (will be created by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        root /home/moa/moa-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/moa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 10: Set Up SSL Certificate (Free)

```bash
# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

#### Step 11: Set Up Domain

1. Buy domain (GoDaddy, Namecheap, etc.)
2. Point DNS A record to your VPS IP
3. Wait 24 hours for propagation

#### Step 12: Access Your System

```
https://your-domain.com
```

---

## Option 3: Docker Self-Hosting (Easiest)

### Requirements
- Docker installed
- Docker Compose installed

### Setup

#### Step 1: Create Docker Compose File

Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: moa-postgres
    environment:
      POSTGRES_DB: moa_system
      POSTGRES_USER: moa_user
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: moa-backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://moa_user:your-secure-password@postgres:5432/moa_system
      JWT_SECRET: your-secret-key
      FRONTEND_URL: https://your-domain.com
    depends_on:
      - postgres
    ports:
      - "5000:5000"
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    container_name: moa-frontend
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Step 2: Update Backend Dockerfile

Edit `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### Step 3: Update Backend for PostgreSQL

Edit `backend/server.js` - change the database connection to use PostgreSQL instead of Supabase:

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Use pool for database queries
// Example: const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

#### Step 4: Build and Start

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

Your system runs on:
- Frontend: `http://localhost`
- Backend: `http://localhost:5000`
- Database: `localhost:5432`

---

## Making It Internet Accessible

### Option A: ngrok (Temporary Testing)

```bash
# Install ngrok
npm install -g ngrok

# Expose your backend
ngrok http 5000

# Expose your frontend
ngrok http 80

# You get temporary URLs like:
# https://abc-123-def.ngrok.io
```

### Option B: Port Forwarding (Home Network)

1. Router settings → Port Forwarding
2. Forward port 80 → your computer port 80
3. Forward port 443 → your computer port 443
4. Find your public IP at [whatismyip.com](https://whatismyip.com)
5. Access via `http://your-public-ip`

### Option C: VPS (Best for Production)

Use DigitalOcean, Linode, etc. (see Option 2 above)

---

## Database Setup (For Self-Hosting)

### Modified `database.sql` (PostgreSQL instead of Supabase)

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- MOAs table
CREATE TABLE IF NOT EXISTS moas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  pdf_filename VARCHAR(255) NOT NULL,
  pdf_original_name VARCHAR(255) NOT NULL,
  pdf_file_size INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  college VARCHAR(255),
  partner_type VARCHAR(255),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_moas_user_id ON moas(user_id);
CREATE INDEX idx_moas_company_name ON moas(company_name);
CREATE INDEX idx_moas_start_date ON moas(start_date);
CREATE INDEX idx_moas_end_date ON moas(end_date);
CREATE INDEX idx_moas_upload_date ON moas(upload_date);
```

---

## Backend Changes Needed (PostgreSQL)

Edit `backend/server.js`:

```javascript
import pkg from 'pg';
const { Pool } = pkg;

// Replace Supabase client with PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Example query
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// File storage: Use local filesystem instead of Supabase
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = './uploads/moas';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Upload endpoint modification
app.post('/api/moas/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const { companyName, startDate, endDate, notes, college, partnerType } = req.body;
    
    // Save file locally
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    // Save to database
    const result = await pool.query(
      'INSERT INTO moas (user_id, company_name, pdf_filename, pdf_original_name, pdf_file_size, start_date, end_date, notes, college, partner_type, upload_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *',
      [req.user.id, companyName, fileName, req.file.originalname, req.file.size, startDate, endDate, notes, college, partnerType]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Maintenance

### Regular Tasks

```bash
# Backup database daily
pg_dump moa_system > backup-$(date +%Y-%m-%d).sql

# Check logs
docker-compose logs backend
docker-compose logs postgres

# Update certificates (if using Let's Encrypt)
sudo certbot renew

# Monitor disk space
df -h

# Monitor memory/CPU
free -h
top
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups/moa"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump moa_system > $BACKUP_DIR/db-$DATE.sql

# PDFs backup
tar -czf $BACKUP_DIR/pdfs-$DATE.tar.gz ./uploads/moas

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL (Let's Encrypt)
- [ ] Configure firewall (only allow 80, 443, 22)
- [ ] Keep software updated
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Use strong database password
- [ ] Disable root SSH login
- [ ] Set up fail2ban (brute force protection)

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -an | grep 5000

# Check PostgreSQL connection
psql postgresql://user:password@localhost/dbname
```

### Database connection error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U moa_user -d moa_system -c "SELECT 1"
```

### Files not uploading
```bash
# Check upload directory permissions
ls -la ./uploads/

# Create if missing
mkdir -p ./uploads/moas
chmod 755 ./uploads/moas
```

### Nginx errors
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

---

## Cost Comparison

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Home Computer | $0 | Free | Must stay on 24/7, internet dependency |
| VPS ($5/mo) | $60/year | Always on, reliable | Small monthly cost |
| Docker locally | $0 | Easy deployment | Must stay on |
| ngrok | Free (temp) | Quick testing | Not for production |

---

## Next Steps

1. **Choose your option** (Home/VPS/Docker)
2. **Set up database** (PostgreSQL)
3. **Configure backend** (.env file)
4. **Build frontend** (npm run build)
5. **Set up Nginx** (reverse proxy)
6. **Make accessible** (port forwarding or VPS)
7. **Test** (register, login, upload MOA)
8. **Monitor** (check logs, monitor resources)

---

## Support

For issues:
1. Check logs: `docker-compose logs` or system logs
2. Test connectivity: `curl http://localhost:5000/api/health`
3. Verify database: `psql -c "SELECT 1"`
4. Check firewall rules

---

**Self-hosting gives you complete control over your MOA system!** 🚀
