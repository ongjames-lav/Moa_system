# MOA System Self-Hosted Quick Start

Get your MOA System running in 30 minutes on your own infrastructure!

## Choose Your Path

### 🐳 **Easiest: Docker (5 minutes)**
Perfect if you have Docker installed.

```bash
# 1. Copy env template
copy .env.example .env

# 2. Edit .env with your passwords
# - Change POSTGRES_PASSWORD
# - Change JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 3. Build and run
docker-compose up -d

# 4. Initialize database
docker exec moa-postgres psql -U moa_user -d moa_system -f /docker-entrypoint-initdb.d/init.sql

# 5. Build frontend
cd frontend
npm install
npm run build
cd ..

# 6. Access
# Open http://localhost in your browser
```

---

### 💻 **Manual: Windows/Mac/Linux (15 minutes)**

#### Step 1: Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: `brew install postgresql@15 && brew services start postgresql@15`
- **Linux**: `sudo apt update && sudo apt install postgresql`

#### Step 2: Create Database
```bash
psql -U postgres

# In psql terminal:
CREATE DATABASE moa_system;
CREATE USER moa_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE moa_system TO moa_user;
\q

# Run schema
psql -U moa_user -d moa_system -f database-postgresql.sql
```

#### Step 3: Configure Backend
```bash
cd backend

# Copy env file
copy .env.example-postgresql .env

# Edit .env:
# - DATABASE_URL=postgresql://moa_user:your-secure-password@localhost:5432/moa_system
# - JWT_SECRET=your-random-secret-32-chars
# - NODE_ENV=production

# Install and start
npm install
node server-postgresql.js
```

Backend runs on `http://localhost:5000`

#### Step 4: Build Frontend
```bash
cd frontend

# Create env file
echo VITE_API_URL=http://localhost:5000/api > .env.local

# Build
npm install
npm run build
```

#### Step 5: Serve Frontend
```bash
# Option A: Use Python
python -m http.server --directory dist 80

# Option B: Use Node
npm install -g http-server
http-server dist -p 80

# Option C: Use Nginx (see SELF_HOSTING_GUIDE.md)
```

Access at `http://localhost`

---

## Make It Internet Accessible

### Option 1: ngrok (Instant Testing)
```bash
npm install -g ngrok
ngrok http 80
# Get URL like: https://abc123.ngrok.io
```

### Option 2: Port Forwarding (Home Network)
1. Open router settings (usually 192.168.1.1)
2. Port Forwarding → Forward port 80 to your computer
3. Find your public IP at [whatismyip.com](https://whatismyip.com)
4. Access via `http://your-public-ip`

⚠️ **Note**: Computer must stay on 24/7

### Option 3: VPS ($5/month, Recommended)
1. Rent VPS from DigitalOcean, Linode, AWS, etc.
2. Follow "VPS Setup" in [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md)
3. Point domain DNS to VPS IP
4. Get free SSL certificate (Let's Encrypt)

---

## Testing

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response includes `token` - copy this!

### 3. Upload MOA
```bash
# First, create a test PDF or use any PDF file

curl -X POST http://localhost:5000/api/moas/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "pdf=@test.pdf" \
  -F "companyName=Test Company" \
  -F "startDate=2024-01-01" \
  -F "endDate=2025-12-31"
```

### 4. Get MOAs
```bash
curl http://localhost:5000/api/moas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Database Backups

### Automated Backup (Linux/Mac)
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/moa"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump moa_system > $BACKUP_DIR/db-$(date +%Y-%m-%d).sql

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Manual Backup
```bash
# PostgreSQL
pg_dump moa_system > backup.sql

# Uploads
tar -czf uploads-backup.tar.gz uploads/

# Restore
psql moa_system < backup.sql
tar -xzf uploads-backup.tar.gz
```

---

## Monitoring & Maintenance

### Check Database
```bash
psql -U moa_user -d moa_system

# Check MOAs count
SELECT COUNT(*) FROM moas;

# Check users
SELECT username, email, created_at FROM users;

# Exit
\q
```

### Check Disk Space
```bash
# Linux/Mac
df -h

# Windows
Get-PSDrive C
```

### Check Running Processes
```bash
# Linux/Mac
ps aux | grep node

# Windows
tasklist | findstr node
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -an | grep 5000

# Check database connection
psql postgresql://moa_user:password@localhost/moa_system
```

### Can't connect to database
```bash
# Check PostgreSQL status
sudo service postgresql status

# Verify connection string in .env
# Format: postgresql://user:password@host:port/database
```

### Files not uploading
```bash
# Check permissions
ls -la uploads/

# Create if missing
mkdir -p uploads/moas
chmod 755 uploads/moas
```

### CORS errors
```bash
# Update FRONTEND_URL in backend .env
# Make sure it matches where frontend is hosted
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS for production (Let's Encrypt)
- [ ] Regular database backups
- [ ] Monitor logs for errors
- [ ] Keep software updated
- [ ] Use firewall (allow only 80, 443, 22)
- [ ] Disable unused services

---

## Next Steps

1. **Local Testing** (this guide) ✓
2. **Internet Access** (ngrok/port forward/VPS)
3. **Add Domain Name** (optional)
4. **Enable HTTPS** (Let's Encrypt)
5. **Set Up Monitoring** (logs, backups)
6. **Deploy Updates** (git pull, npm install, rebuild)

---

## Files Reference

- `backend/server-postgresql.js` - Express backend
- `database-postgresql.sql` - Database schema
- `docker-compose.yml` - Docker deployment
- `nginx.conf` - Reverse proxy config
- `SELF_HOSTING_GUIDE.md` - Detailed setup guide
- `frontend/` - React frontend
- `uploads/` - PDF storage

---

## Support

**Having issues?**
1. Check `SELF_HOSTING_GUIDE.md` for detailed setup
2. Check logs: `docker-compose logs` or console output
3. Verify .env file settings
4. Test database connection
5. Check firewall/port forwarding

---

## You're Ready! 🚀

Your MOA System is self-hosted and under your control. Enjoy complete data privacy and independence!

Need help? See [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md) for comprehensive documentation.
