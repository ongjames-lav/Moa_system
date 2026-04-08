# MOA Management System - Cloud Ready Edition

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)

A complete Memorandum of Agreement (MOA) management system with user authentication, designed for both local development and cloud deployment. Upload, organize, search, and manage all your MOAs in one place.

## ✨ Features

- 👤 **User Authentication** - Secure login and registration with JWT tokens
- 📄 **MOA Management** - Upload, edit, delete, and search MOAs
- 📋 **Rich Metadata** - Store company name, dates, notes, college, partner type
- 🔍 **Advanced Search** - Find MOAs by company name, notes, or filename
- 📊 **Sorting & Filtering** - Sort by dates, upload time, or company name
- 📈 **Status Tracking** - Automatic Active/Inactive status based on dates
- 📥 **Pagination** - Handle large numbers of MOAs efficiently
- 🔒 **Secure PDF Storage** - PDFs stored in cloud with access control
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ☁️ **Cloud Ready** - Deploy to Netlify, Render, and Supabase for free

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Git
- Supabase account (free)

### Setup (5 minutes)

```bash
# 1. Clone or download this repository
cd moa-system

# 2. Set up Supabase (see LOCAL_DEVELOPMENT.md step 1)

# 3. Start both backend and frontend
npm run dev:cloud

# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed instructions.

## 📦 Project Structure

```
moa-system/
├── backend/              # Node.js Express API server
│   ├── server.js        # Main backend file
│   ├── package.json     # Dependencies
│   └── .env.example     # Environment template
├── frontend/            # Web app (HTML/CSS/JS)
│   ├── index.html       # Main page
│   ├── src/
│   │   ├── app.js       # Main JavaScript
│   │   └── styles.css   # Styling
│   ├── package.json
│   └── vite.config.js   # Build config
├── database.sql         # Supabase schema
└── [guides and docs]
```

## 🌐 Cloud Deployment (100% Free!)

Deploy your MOA System to the cloud using completely free services:

| Component | Service | Cost | Details |
|-----------|---------|------|---------|
| **Frontend** | Netlify or Vercel | $0 | Unlimited bandwidth |
| **Backend** | Render.com | $0 | 750 free hours/month |
| **Database** | Supabase | $0 | 500MB database + 1GB storage |
| **Total** | - | **$0/month** | ✅ Forever free |

### Deploy in 30 minutes
See [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

## 📖 Documentation

- **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Local setup and development guide
- **[CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[database.sql](database.sql)** - Database schema
- **[API Documentation](#api-endpoints)** - REST API reference

## 🔐 Authentication

### Register
```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure_password"
}
```

Response includes JWT token for authenticated requests.

## 📚 API Endpoints

All endpoints require: `Authorization: Bearer {token}`

### MOAs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moas` | List all MOAs with pagination |
| GET | `/api/moas/:id` | Get single MOA details |
| POST | `/api/moas/upload` | Upload new MOA with PDF |
| PUT | `/api/moas/:id` | Update MOA metadata |
| DELETE | `/api/moas/:id` | Delete single MOA |
| POST | `/api/moas/delete-multiple` | Delete multiple MOAs |
| GET | `/api/moas/search?q=query` | Search MOAs |
| GET | `/api/moas/:id/download` | Get PDF download link |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Cloud Storage (via Supabase)
- **Auth**: JWT tokens + bcrypt
- **Server**: Render.com (free tier)

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **Framework**: None (lightweight!)
- **Styling**: CSS3
- **Build**: Vite
- **Hosting**: Netlify or Vercel (free)

### Infrastructure
- **Database**: Supabase PostgreSQL (free 500MB)
- **File Storage**: Supabase Storage (free 1GB)
- **Container**: Docker-ready (Dockerfile included)

## 📱 Screenshots

### Login Screen
- Clean, professional authentication
- Register or login tabs
- Error handling

### Dashboard
- MOA list with tile or list view
- Real-time search
- Advanced filtering and sorting
- Pagination support

### MOA Card
- Company name and dates
- Active/Inactive status badge
- Quick actions: Edit, Download, Delete
- College and Partner Type info

### Modals
- Upload new MOA
- Edit MOA details
- Confirm delete operations

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Bcrypt password hashing
- ✅ Row-level security in database
- ✅ HTTPS/SSL on all services
- ✅ CORS protection
- ✅ Private PDF storage
- ✅ User isolation (users only see their own MOAs)

## 📊 Database Schema

### Users Table
```sql
- id (UUID, primary key)
- username (TEXT, unique)
- email (TEXT, unique)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### MOAs Table
```sql
- id (UUID, primary key)
- user_id (UUID, references users)
- company_name (TEXT)
- pdf_filename (TEXT)
- pdf_original_name (TEXT)
- pdf_file_size (INTEGER)
- start_date (DATE)
- end_date (DATE)
- notes (TEXT)
- college (TEXT)
- partner_type (TEXT)
- upload_date (TIMESTAMP)
- last_modified (TIMESTAMP)
```

## 🚀 Commands

### Local Development
```bash
# Start both frontend and backend
npm run dev:cloud

# Or separately:
npm run backend    # Start backend on :5000
npm run frontend   # Start frontend on :5173
```

### Production Build
```bash
# Build frontend for production
npm run build:cloud

# Build just frontend
cd frontend && npm run build

# Docker build (if deploying via Docker)
docker build -t moa-system .
```

## 🌍 Deployment Options

### Option 1: Netlify + Render (Recommended)
- Frontend: Netlify (free, unlimited bandwidth)
- Backend: Render (free tier: 750 hours/month)
- Database: Supabase (free: 500MB)
- See [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

### Option 2: Vercel + Render
- Frontend: Vercel (free, fast edge network)
- Backend: Render (free tier)
- Database: Supabase (free)

### Option 3: Self-hosted
- Use Docker to run anywhere
- Dockerfile included

## 💰 Cost Estimation

### Free Tier (Recommended for small teams)
| Component | Cost | Limit |
|-----------|------|-------|
| Frontend CDN | $0 | Unlimited bandwidth |
| Backend | $0 | 750 hours/month |
| Database | $0 | 500MB storage |
| PDF Storage | $0 | 1GB |
| **Total** | **$0** | Handles ~1000 MOAs |

### Scaling (If you grow)
- Supabase Pro: $25/month → 100GB storage
- Render Paid: $7+/month → Always running (no cold starts)
- Netlify/Vercel: Usually free is enough

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 5000 isn't in use
lsof -i :5000

# Check Node.js version
node --version  # Should be 18+

# Check .env file exists
cat backend/.env
```

### Can't reach Supabase
- Verify SUPABASE_URL in .env
- Check internet connection
- Verify API key is correct

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check VITE_API_URL is correct
- Open browser console (F12) for error details

## 📞 Support

1. **Check the documentation**: [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. **Check the guide**: [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)
3. **Review the logs**: 
   - Backend: Terminal running `npm run backend`
   - Frontend: Browser console (F12)
   - Cloud: Service dashboard logs

## 🎯 Next Steps

1. ✅ **Local Setup**: Follow [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. ✅ **Test Locally**: Upload some test MOAs
3. ✅ **Deploy to Cloud**: Follow [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)
4. ✅ **Share with Team**: Share your cloud URL with users
5. ✅ **Monitor**: Check logs regularly

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Fix bugs
- Add features
- Improve documentation
- Suggest improvements

## 🎉 Credits

Built with love for managing MOAs effectively.

---

**Current Version**: 2.0.0 (Cloud Ready)
**Last Updated**: March 2026
**Status**: Production Ready ✅

For questions or issues, check the documentation files included in this project.

Happy MOA managing! 📋
