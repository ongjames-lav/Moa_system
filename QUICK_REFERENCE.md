# MOA System - Quick Reference Card

## 🚀 Start Local Development (Copy & Paste)

```bash
# 1. Start Backend Server
cd backend
npm install
cp .env.example .env
# Edit .env with Supabase credentials
npm run dev

# 2. In another terminal, Start Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173 in browser
```

## 🌐 Deploy to Cloud (Copy & Paste Steps)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "MOA System cloud deployment"
git remote add origin https://github.com/YOUR_USERNAME/moa-system.git
git branch -M main
git push -u origin main

# 2. Create Supabase Project
# Go to supabase.com → Create new project → Save credentials

# 3. Create Supabase Database
# In Supabase SQL Editor → Paste database.sql → Run

# 4. Create Storage Bucket
# In Supabase Storage → Create new bucket "moas" → Make it PRIVATE

# 5. Deploy Backend to Render.com
# Go to render.com → New Web Service → Connect GitHub → Select repo
# Build Command: cd backend && npm install
# Start Command: cd backend && node server.js
# Add environment variables: SUPABASE_URL, SUPABASE_KEY, JWT_SECRET

# 6. Deploy Frontend to Netlify
# Go to netlify.com → New site from Git → Select repo
# Base directory: frontend
# Build command: npm run build
# Publish directory: frontend/dist
# Add environment: VITE_API_URL=https://your-backend-url.onrender.com/api
```

## 📋 Project Files

### Backend
- `backend/server.js` - Express API (all routes in one file)
- `backend/package.json` - Dependencies
- `backend/.env.example` - Environment template

### Frontend
- `frontend/index.html` - HTML structure
- `frontend/src/app.js` - Main JavaScript logic
- `frontend/src/styles.css` - All styling
- `frontend/vite.config.js` - Build config

### Documentation
- `LOCAL_DEVELOPMENT.md` - Local setup guide
- `CLOUD_DEPLOYMENT_GUIDE.md` - Cloud deployment guide
- `README_CLOUD_READY.md` - Full documentation
- `DEPLOYMENT_COMPLETE.md` - Summary of changes
- `database.sql` - Database schema

### Config
- `Dockerfile` - Docker container
- `render.yaml` - Render.com deployment
- `netlify.toml` - Netlify configuration

## 🔑 Important Environment Variables

### Backend (.env)
```
NODE_ENV=development
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxx
JWT_SECRET=your-random-secret-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### MOAs
- `GET /api/moas` - List MOAs
- `POST /api/moas/upload` - Upload MOA
- `PUT /api/moas/:id` - Edit MOA
- `DELETE /api/moas/:id` - Delete MOA
- `GET /api/moas/search?q=query` - Search MOAs
- `GET /api/moas/:id/download` - Download PDF

## 🎯 Key Folders

| Folder | Purpose |
|--------|---------|
| `backend/` | Node.js Express API server |
| `frontend/` | Web app (HTML/CSS/JS) |
| `src/` | OLD: Original desktop app (deprecated) |
| `data/` | OLD: Local storage (deprecated) |

## ✅ Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Upload MOA with PDF
- [ ] Edit MOA details
- [ ] Search for MOA
- [ ] Filter by college/partner type
- [ ] Download PDF
- [ ] Delete MOA
- [ ] Logout

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check port 5000 is free
lsof -i :5000

# Check Node version
node --version  # Should be 18+

# Check Supabase credentials
cat backend/.env
```

### Frontend won't connect
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check VITE_API_URL is set
cat frontend/.env.local

# Check browser console (F12)
```

### Database connection fails
```bash
# Verify Supabase URL
# Verify API key
# Check tables exist in Supabase
# Verify RLS policies are enabled
```

## 💡 Tips

- **Storage limit**: Supabase free = 1GB. Each PDF counts against this.
- **Cold starts**: Render free tier sleeps after 15 min. First request is slower.
- **Bandwidth**: Netlify/Vercel unlimited. No worries about traffic.
- **Session**: Token stored in localStorage. Persists across page refreshes.
- **Search**: Case-insensitive, searches company name and notes.
- **Status**: Active if today is between start and end date.

## 📞 Resources

- Supabase docs: https://supabase.com/docs
- Express docs: https://expressjs.com
- Vite docs: https://vitejs.dev
- Render docs: https://render.com/docs
- Netlify docs: https://docs.netlify.com

## 🎓 Learning Path

1. **Understand structure** - Read README_CLOUD_READY.md
2. **Setup locally** - Follow LOCAL_DEVELOPMENT.md
3. **Explore code** - Read comments in app.js and server.js
4. **Deploy** - Follow CLOUD_DEPLOYMENT_GUIDE.md
5. **Customize** - Modify colors, features, fields
6. **Share** - Send cloud URL to team

## 💰 Cost Calculator

```
Free Tier Usage:
- 1000 MOAs × 3MB average = 3GB storage ❌ (exceeds 1GB free limit)
- 1000 MOAs × 1MB average = 1GB storage ✅ (fits free limit)
- 100 users × 20 MOAs = 2000 MOAs total

Cost per month:
- Supabase: $0 (free tier) or $25/month (100GB)
- Render: $0 (free tier) or $7/month (always on)
- Netlify: $0 (always free)
- Total: $0-32/month depending on scale
```

---

**Done!** Your system is ready to deploy. Start with LOCAL_DEVELOPMENT.md, then follow CLOUD_DEPLOYMENT_GUIDE.md.

Questions? Check the full documentation files.
