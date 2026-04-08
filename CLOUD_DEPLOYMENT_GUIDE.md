# MOA System - Cloud Deployment Guide

This guide will help you deploy the MOA System to the cloud using **completely free services**: Supabase (database), Render.com (backend), and Netlify/Vercel (frontend).

## Architecture Overview

```
Netlify/Vercel (Frontend)
         ↓
Render.com (Node.js Backend API)
         ↓
Supabase (PostgreSQL + Storage)
```

---

## Step 1: Set Up Supabase (Database & Storage)

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Sign Up"
3. Use GitHub account (recommended) or email
4. Create new organization

### 1.2 Create Database Project
1. Click "New Project"
2. Enter project name: `moa-system`
3. Create a strong database password (save it!)
4. Select region closest to you
5. Wait for project to initialize (5-10 minutes)

### 1.3 Get Supabase Credentials
1. Go to **Settings → API**
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY` (keep secret!)
3. Save these values - you'll need them

### 1.4 Create Database Tables
1. Go to **SQL Editor**
2. Create new query
3. Copy contents of `database.sql` from this project
4. Paste into Supabase SQL editor
5. Click "Run"
6. Wait for tables to be created

### 1.5 Create Storage Bucket
1. Go to **Storage**
2. Click "New Bucket"
3. Name: `moas`
4. Make it **PRIVATE** (important!)
5. Click "Create Bucket"

### 1.6 Enable User Signup (Optional)
1. Go to **Authentication → Providers**
2. Click "Email"
3. Enable "Confirm email"
4. Save settings

---

## Step 2: Deploy Backend to Render.com

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account (recommended)
3. Create account

### 2.2 Push Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: MOA System cloud deployment"

# Create repo on GitHub at github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/moa-system.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy Backend on Render
1. Go to [render.com dashboard](https://dashboard.render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub (authorize)
5. Select your `moa-system` repository
6. Configure:
   - **Name**: `moa-backend`
   - **Environment**: Node
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
7. Click "Create Web Service"

### 2.4 Add Environment Variables (Render)
1. Go to your service dashboard
2. Click "Environment"
3. Add these variables:
   ```
   NODE_ENV = production
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_KEY = your-anon-key-from-supabase
   JWT_SECRET = generate-a-random-secret-key-here
   FRONTEND_URL = https://moa-system-frontend.netlify.app (or your Vercel URL)
   ```
4. Click "Save"
5. Wait for deployment (5-10 minutes)

### 2.5 Get Backend URL
1. Once deployed, copy the URL from Render dashboard
2. Format: `https://moa-backend-xxxx.onrender.com`
3. Save this - you'll need it for frontend

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub (recommended)

### 3.2 Deploy Frontend
1. Click "Add new site"
2. Select "Import an existing project"
3. Choose GitHub
4. Find your `moa-system` repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Click "Deploy site"

### 3.3 Add Environment Variables (Netlify)
1. Go to Site Settings
2. Click "Build & Deploy → Environment"
3. Click "Add environment variables"
4. Add:
   ```
   VITE_API_URL = https://your-backend-url.onrender.com/api
   ```
5. Save and trigger redeploy

### 3.4 Add Redirect Rules (Netlify)
1. Create `frontend/netlify.toml`:
```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

---

## Step 4: Alternative - Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 4.2 Deploy
1. Click "New Project"
2. Select your GitHub repository
3. Configure:
   - **Framework**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   ```
   VITE_API_URL = https://your-backend-url.onrender.com/api
   ```
5. Click "Deploy"

---

## Step 5: Test Everything

### 5.1 Test Backend API
```bash
curl https://your-backend-url.onrender.com/api/health
# Should return: {"status":"OK"}
```

### 5.2 Test Frontend
1. Open your frontend URL in browser
2. Register a new account
3. Login
4. Try uploading a sample MOA PDF
5. Verify MOA appears in list
6. Test edit, delete, search, sort

---

## Troubleshooting

### Backend Not Working
1. Check Render logs: Dashboard → Logs
2. Verify Supabase credentials in environment variables
3. Check JWT_SECRET is set
4. Restart service: Dashboard → Manual Deploy

### Frontend Not Connecting
1. Check VITE_API_URL environment variable
2. Verify backend is running and responding
3. Check browser console for errors (F12)
4. Trigger redeploy on Netlify/Vercel

### Database Connection Issues
1. Verify SUPABASE_URL and SUPABASE_KEY are correct
2. Check Supabase project is active
3. Verify tables exist in Supabase SQL Editor
4. Check RLS policies are enabled

### PDF Upload Fails
1. Verify storage bucket `moas` exists in Supabase
2. Check storage policies are set correctly
3. Ensure file is valid PDF
4. Check file size (should be under 50MB)

---

## Production Checklist

- [ ] Supabase project created and databases configured
- [ ] Backend deployed on Render with all env variables
- [ ] Frontend deployed on Netlify/Vercel with VITE_API_URL set
- [ ] Email notifications enabled (optional)
- [ ] Database backups configured in Supabase
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled (automatic on Render/Netlify/Vercel)
- [ ] Tested register → login → upload → download flow

---

## Free Service Limits

| Service | Limit | Notes |
|---------|-------|-------|
| **Supabase** | 500MB DB, 1GB storage | Generous free tier |
| **Render** | 750 hours/month | Always free, no sleep! |
| **Netlify** | Unlimited bandwidth | Free tier is great |
| **Vercel** | Unlimited bandwidth | Free tier is great |

---

## Upgrading (When You Need More)

- **Supabase**: $25/month → 100GB storage
- **Render**: $7-12/month → Always running (no cold starts)
- **Netlify/Vercel**: Usually free is enough

---

## Next Steps

1. Complete steps 1-3 above
2. Test the deployment
3. Share with team: `https://your-frontend-url.netlify.app`
4. Monitor logs in Render dashboard
5. Add more users as needed

---

## Support

For issues:
1. Check Render logs
2. Check Supabase dashboard
3. Check browser console (F12)
4. Verify environment variables are set correctly

---

**Deployment Complete!** 🎉

Your MOA System is now live and accessible from anywhere in the world!
