# MOA System - Local Development Guide

This guide will help you set up and run the MOA System locally for development.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- A code editor (VS Code recommended)
- Supabase account (free tier okay)

## Project Structure

```
moa-system/
├── backend/                    # Node.js Express API
│   ├── server.js              # Main server file
│   ├── package.json
│   ├── .env.example
│   ├── routes/                # API route handlers
│   ├── middleware/            # Auth middleware
│   └── controllers/           # Business logic
├── frontend/                  # Web app (HTML/CSS/JS)
│   ├── index.html
│   ├── src/
│   │   ├── app.js            # Main JS app
│   │   ├── styles.css        # Styles
│   │   └── api.js            # API client
│   ├── vite.config.js
│   └── package.json
├── database.sql              # Supabase schema
├── CLOUD_DEPLOYMENT_GUIDE.md # Production deployment
└── LOCAL_DEVELOPMENT.md      # This file
```

## Step 1: Set Up Supabase

### 1.1 Create Free Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up (use GitHub for easier auth)
3. Create new project
4. Save your credentials:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJxxxxx`

### 1.2 Create Database Schema
1. In Supabase → SQL Editor
2. Create new query
3. Copy contents of `database.sql`
4. Run the SQL script

### 1.3 Create Storage Bucket
1. Supabase → Storage
2. Create new bucket named `moas` (private)

## Step 2: Set Up Backend

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJxxxxx
# JWT_SECRET=your-random-secret-key-here
```

### 2.3 Start Backend Server
```bash
npm run dev
# Server runs on http://localhost:5000
```

You should see:
```
✅ MOA System Backend running on port 5000
📝 API Documentation: http://localhost:5000/api
```

## Step 3: Set Up Frontend

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Configure Environment
```bash
# Create .env.local
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

### 3.3 Start Frontend Dev Server
```bash
npm run dev
# App opens on http://localhost:5173
```

## Step 4: Test the Application

### 4.1 Register New Account
1. Open http://localhost:5173
2. Click "Register" tab
3. Enter username, email, password
4. Click "Register"
5. Should redirect to dashboard

### 4.2 Upload a Sample MOA
1. Click "➕ Upload MOA"
2. Fill in:
   - Company Name: "Test Company"
   - Start Date: 2024-01-01
   - End Date: 2025-12-31
   - Notes: "Test MOA"
3. Select any PDF file
4. Click "Upload MOA"

### 4.3 Test Operations
- **Search**: Type in search box
- **Sort**: Change sort dropdown
- **Edit**: Click 📋 on a card
- **Delete**: Click 🗑️ on a card
- **Download**: Click 📂 on a card

## Development Workflow

### Working on Backend
```bash
# In backend/ folder
npm run dev

# Backend auto-reloads on file changes
# Changes to routes/ or server.js are reflected immediately
```

### Working on Frontend
```bash
# In frontend/ folder
npm run dev

# Frontend auto-reloads on file changes
# Changes to HTML/CSS/JS are reflected immediately
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build
# Output: frontend/dist/

# Backend runs as-is (no build needed)
```

## API Endpoints

All endpoints require `Authorization: Bearer {token}` header.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### MOAs
- `GET /api/moas` - List MOAs with pagination
- `GET /api/moas/:id` - Get single MOA
- `POST /api/moas/upload` - Upload new MOA (multipart/form-data)
- `PUT /api/moas/:id` - Update MOA
- `DELETE /api/moas/:id` - Delete MOA
- `POST /api/moas/delete-multiple` - Batch delete
- `GET /api/moas/search?q=query` - Search MOAs
- `GET /api/moas/:id/download` - Get download URL

## Database Schema

### users table
```sql
- id (UUID, primary key)
- username (TEXT, unique)
- email (TEXT, unique)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### moas table
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

## Common Development Tasks

### Add New API Endpoint
1. Edit `backend/server.js`
2. Add new route (e.g., `app.post('/api/custom', handler)`)
3. Test with Postman or curl
4. Frontend will call via `fetch(API_URL + '/custom')`

### Modify Frontend UI
1. Edit `frontend/index.html` for structure
2. Edit `frontend/src/styles.css` for styling
3. Edit `frontend/src/app.js` for JavaScript logic
4. Changes auto-reload in dev mode

### Update Database Schema
1. Edit `database.sql`
2. Create new SQL query in Supabase
3. Run the new SQL
4. Verify in Supabase dashboard

## Debugging

### Check Backend Logs
```bash
# Terminal running backend server shows:
# - Server startup
# - Request logs
# - Error messages
# - Database queries
```

### Check Frontend Console
```bash
# Open browser
# Press F12
# Go to Console tab
# Look for errors/warnings
```

### Test API Directly
```bash
# Get auth token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token in requests
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/moas
```

## Troubleshooting

### Backend won't start
- Check port 5000 isn't in use: `netstat -ano | findstr :5000`
- Verify Node.js installed: `node --version`
- Check .env file exists and has SUPABASE_URL

### Can't connect to Supabase
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Check internet connection
- Check Supabase project is active (dashboard)

### Frontend can't reach backend
- Verify backend is running on port 5000
- Check VITE_API_URL in frontend/.env.local
- Browser console should show API URL being used

### File upload fails
- Check storage bucket `moas` exists
- Verify file is valid PDF
- Check file size < 50MB
- Check storage policies in Supabase

## Performance Tips

- Use `npm run build` to create optimized production build
- Enable caching in Supabase for frequently accessed data
- Use Vite's code splitting for faster page loads
- Implement pagination (already done) to avoid loading too many records

## Next Steps

1. **Complete local setup** (steps 1-4 above)
2. **Make some test uploads** to verify everything works
3. **Explore the codebase** to understand the flow
4. **Make your first change** (e.g., modify a button label)
5. **Deploy to cloud** when ready (see CLOUD_DEPLOYMENT_GUIDE.md)

---

Happy coding! 🚀
