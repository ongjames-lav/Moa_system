# MOA System - Self-Hosted Documentation Index

Welcome! Your MOA System is now configured for **self-hosting**. Here's how to navigate the documentation.

---

## 🚀 Start Here (Choose Your Path)

### ⚡ **I want to get started in 5 minutes**
→ Read: [`SELF_HOSTING_QUICK_START.md`](SELF_HOSTING_QUICK_START.md)
- Docker setup (recommended)
- Manual setup
- Quick testing

### 📖 **I need comprehensive setup guidance**
→ Read: [`SELF_HOSTING_GUIDE.md`](SELF_HOSTING_GUIDE.md)
- Detailed step-by-step
- 3 deployment options
- VPS setup with domain
- SSL certificates
- Monitoring & backups

### ✅ **What was changed/created?**
→ Read: [`SELF_HOSTING_SETUP_COMPLETE.md`](SELF_HOSTING_SETUP_COMPLETE.md)
- New files created
- Architecture overview
- Technology stack
- Quick reference

### 📋 **Status of my project**
→ Read: [`SELF_HOSTED_READY.md`](SELF_HOSTED_READY.md)
- Project readiness
- File structure
- Feature checklist
- Next steps

---

## 📁 Complete File Structure

### New Self-Hosting Files
```
MOA System/
├── SELF_HOSTING_QUICK_START.md      ← Quick setup guide (START HERE)
├── SELF_HOSTING_GUIDE.md             ← Comprehensive guide
├── SELF_HOSTED_READY.md              ← Status & overview
├── SELF_HOSTING_SETUP_COMPLETE.md    ← What was created
├── INDEX.md                          ← This file
│
├── backend/
│   ├── server-postgresql.js          ← PostgreSQL version (USE THIS)
│   ├── server.js                     ← OLD: Supabase version (DEPRECATED)
│   ├── Dockerfile                    ← Docker container
│   └── .env.example-postgresql       ← Environment template
│
├── database-postgresql.sql           ← PostgreSQL schema
├── docker-compose.yml                ← Docker deployment
├── nginx.conf                        ← Web server config
├── .env.example                      ← Docker env template
└── frontend/
    └── src/
        └── app.js                    ← Frontend logic (unchanged)
```

### Legacy Cloud Files (Deprecated)
```
├── CLOUD_DEPLOYMENT_GUIDE.md         ← OLD (ignore)
├── README_CLOUD_READY.md             ← OLD (reference only)
├── backend/server.js                 ← OLD: Supabase version
└── Dockerfile (old)                  ← OLD (ignore)
```

---

## 🎯 Choose Your Deployment

### 1. **Docker** (Easiest)
- **Time**: 5 minutes
- **Difficulty**: Easy
- **Best for**: Most users
- **Read**: Quick Start → Docker section

### 2. **Manual** (Traditional)
- **Time**: 15 minutes
- **Difficulty**: Medium
- **Best for**: Learning/control
- **Read**: Quick Start → Manual section

### 3. **VPS** (Production)
- **Time**: 20 minutes
- **Difficulty**: Medium
- **Best for**: 24/7 uptime
- **Read**: Detailed Guide → VPS Setup section

---

## 📚 Documentation by Purpose

### I want to...

#### Deploy Locally (Testing)
1. Read: `SELF_HOSTING_QUICK_START.md` (Docker section)
2. Follow: Step-by-step setup
3. Test: With browser at `http://localhost`

#### Deploy with Domain & HTTPS
1. Read: `SELF_HOSTING_GUIDE.md` (VPS section)
2. Rent: Small VPS ($5/month)
3. Configure: Domain & SSL certificate
4. Access: `https://your-domain.com`

#### Understand Architecture
1. Read: `SELF_HOSTING_SETUP_COMPLETE.md` (Architecture section)
2. Review: `docker-compose.yml`
3. Review: `nginx.conf`

#### Set Up Database
1. Read: `SELF_HOSTING_GUIDE.md` (Database Setup section)
2. Run: `database-postgresql.sql`
3. Verify: `psql` commands

#### Back Up & Maintain
1. Read: `SELF_HOSTING_GUIDE.md` (Maintenance section)
2. Set up: Automated backups
3. Monitor: Logs & disk space

#### Troubleshoot Issues
1. Read: `SELF_HOSTING_QUICK_START.md` (Troubleshooting section)
2. Read: `SELF_HOSTING_GUIDE.md` (Troubleshooting section)
3. Check: Docker logs: `docker-compose logs -f`

---

## 🔑 Key Concepts

### Self-Hosting vs Cloud
| Aspect | Self-Hosted | Cloud |
|--------|------------|-------|
| **Where** | Your server | Provider servers |
| **Cost** | $0-10/mo | $0 (cloud free tier) |
| **Control** | 100% yours | Provider controls |
| **Data** | Your location | Provider location |
| **Setup** | You manage | Provider manages |

### Technology Stack
- **Web**: Nginx (reverse proxy)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **Files**: Local filesystem
- **Deploy**: Docker (optional)

### Data Flow
```
User Browser
    ↓ (HTTPS)
Nginx (Port 80/443)
    ↓ /api requests
Express Backend (Port 5000)
    ↓ Database queries
PostgreSQL (Port 5432)
    ↓ File storage
./uploads/moas/
```

---

## 🎬 Quick Start Videos (Self-Explanatory)

### If you're visual learner:

1. **Docker Setup** (5 min)
   - Copy .env.example → .env
   - docker-compose up -d
   - Access localhost

2. **Manual Setup** (15 min)
   - Install PostgreSQL
   - Create database
   - Run backend
   - Serve frontend

3. **VPS Setup** (20 min)
   - Rent VPS
   - Install Docker
   - Deploy code
   - Configure domain

All detailed in guides!

---

## 🔒 Security

### Passwords & Keys
- **Database password**: Set in .env
- **JWT secret**: Generate 32-char random string
- **Frontend URL**: Update to your domain

### Stored Securely
- Passwords: hashed with bcryptjs (10 rounds)
- Tokens: JWTs, stored in browser localStorage
- Files: Local filesystem, access via authenticated API

### Network Security
- CORS: Frontend origin validation
- HTTPS: Use Let's Encrypt (free)
- Firewall: Allow only 80, 443, 22 ports

---

## 💾 Backup & Recovery

### Automated Backup (Recommended)
```bash
# Linux/Mac: Add to crontab
0 2 * * * pg_dump moa_system > /backups/db-$(date +%Y-%m-%d).sql
```

### Manual Backup
```bash
# Database
pg_dump moa_system > backup.sql

# Files
tar -czf uploads-backup.tar.gz uploads/
```

### Recovery
```bash
# Database
psql moa_system < backup.sql

# Files
tar -xzf uploads-backup.tar.gz
```

---

## 🌐 Internet Access Options

### Option 1: ngrok (Temporary)
```bash
ngrok http 80
# Get temporary public URL
# Perfect for quick testing
```

### Option 2: Port Forwarding (Home Network)
- Router settings → Port Forward
- Forward port 80 to your computer
- Access via public IP
- ⚠️ Computer must stay on 24/7

### Option 3: VPS (Recommended)
- Rent: DigitalOcean ($5/mo)
- Use: docker-compose
- Domain: Point to VPS IP
- SSL: Let's Encrypt (free)

See `SELF_HOSTING_GUIDE.md` for detailed steps!

---

## 🐛 Troubleshooting Quick Links

### Backend Issues
→ See: `SELF_HOSTING_QUICK_START.md` → Troubleshooting → Backend won't start

### Database Issues
→ See: `SELF_HOSTING_QUICK_START.md` → Troubleshooting → Can't connect to database

### File Upload Issues
→ See: `SELF_HOSTING_QUICK_START.md` → Troubleshooting → Files not uploading

### General Help
→ See: `SELF_HOSTING_GUIDE.md` → Troubleshooting (comprehensive section)

---

## 📊 Files at a Glance

| File | Purpose | Read When |
|------|---------|-----------|
| **SELF_HOSTING_QUICK_START.md** | 5-30 min setup | First time setup |
| **SELF_HOSTING_GUIDE.md** | Detailed guide | Need more details |
| **SELF_HOSTED_READY.md** | Status & overview | Want full context |
| **SELF_HOSTING_SETUP_COMPLETE.md** | What was created | Understanding changes |
| **server-postgresql.js** | Backend API | Implementing features |
| **database-postgresql.sql** | Database schema | Database questions |
| **docker-compose.yml** | Deployment config | Containerization |
| **nginx.conf** | Web server | Web server config |
| **.env.example** | Environment vars | Configuration |

---

## ⏱️ Time Estimates

| Task | Time | Difficulty |
|------|------|-----------|
| Read Quick Start | 10 min | Easy |
| Docker setup | 5 min | Easy |
| Manual setup | 15 min | Medium |
| VPS setup | 30 min | Medium |
| Domain setup | 10 min | Medium |
| SSL certificate | 5 min | Easy |
| Test system | 10 min | Easy |
| **Total** | **1-2 hours** | Easy-Medium |

---

## ✅ Checklist Before Going Live

### Pre-Deployment
- [ ] Read appropriate guide
- [ ] Install prerequisites
- [ ] Configure .env file
- [ ] Test locally

### Deployment
- [ ] Start services
- [ ] Verify database connection
- [ ] Test registration/login
- [ ] Test file upload/download

### Going Internet Accessible
- [ ] Set up port forwarding OR rent VPS
- [ ] Configure frontend API URL
- [ ] Test from external device

### Production Ready
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Set up automated backups
- [ ] Configure firewall
- [ ] Enable HTTPS/SSL
- [ ] Monitor logs

---

## 🎯 Next Action

1. **Choose your deployment**:
   - Docker (recommended)
   - Manual setup
   - VPS (production)

2. **Open appropriate guide**:
   - Quick: `SELF_HOSTING_QUICK_START.md`
   - Detailed: `SELF_HOSTING_GUIDE.md`

3. **Follow step-by-step instructions**

4. **Test the system**

5. **Deploy to internet** (port forward or VPS)

---

## 📞 Quick Reference

### Start Everything
```bash
docker-compose up -d
```

### Stop Everything
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Access Database
```bash
psql -U moa_user -d moa_system
```

### Backup Database
```bash
pg_dump moa_system > backup.sql
```

---

## 🎓 Learning Resources

### Inside This Project
- Backend code: `backend/server-postgresql.js`
- Database: `database-postgresql.sql`
- Web server: `nginx.conf`
- Docker: `docker-compose.yml`

### External Resources
- PostgreSQL docs: [postgresql.org](https://www.postgresql.org/docs/)
- Express docs: [expressjs.com](https://expressjs.com/)
- Docker docs: [docker.com/docs](https://docs.docker.com/)
- Nginx docs: [nginx.org/docs](https://nginx.org/en/docs/)

---

## 🎉 You're Ready!

Your MOA System is fully configured for self-hosting:

✓ Complete backend with PostgreSQL
✓ Database schema ready
✓ Docker deployment ready
✓ Nginx configuration ready
✓ Comprehensive guides included
✓ Security best practices built-in

**Next Step**: Choose deployment option and read appropriate guide!

---

## 📋 Document Navigation Tree

```
START HERE
├── SELF_HOSTING_QUICK_START.md (5 min setup)
│   ├── Docker path
│   ├── Manual path
│   ├── Testing
│   └── Internet access
│
├── SELF_HOSTING_GUIDE.md (detailed reference)
│   ├── Option 1: Home Computer
│   ├── Option 2: VPS (best)
│   ├── Option 3: Docker
│   ├── Database setup
│   ├── SSL certificates
│   ├── Backups & maintenance
│   └── Troubleshooting
│
├── SELF_HOSTED_READY.md (overview)
│   ├── What changed
│   ├── Architecture
│   ├── Technology stack
│   └── Feature checklist
│
└── SELF_HOSTING_SETUP_COMPLETE.md (status)
    ├── Files created
    ├── Architecture diagram
    ├── Security features
    └── Next steps
```

---

**Happy self-hosting! 🚀**

Your data. Your server. Your control. 100%
