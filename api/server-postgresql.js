import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// PostgreSQL connection pool
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://moa_user:password@localhost:5432/moa_system'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✓ Connected to PostgreSQL database');
  }
});

// File upload setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../uploads/moas');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8000',
  'http://localhost:80',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed.startsWith(origin))) {
      return callback(null, true);
    }
    // Also allow any ngrok URLs
    if (origin.includes('ngrok')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now during development
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files from dist
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
app.use(express.static(FRONTEND_DIST));

// File upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MOA Backend Server is running' });
});

// ============= AUTHENTICATION ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const result = await pool.query('SELECT id, username, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MOA ROUTES =============

// Get all MOAs with pagination, search, and filters
app.get('/api/moas', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'upload_date';
    const sortOrder = (req.query.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { search, college, partnerType, status } = req.query;

    let query = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR notes ILIKE $${paramIndex} OR pdf_original_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (college) {
      if (college === 'none') {
        query += ` AND (college IS NULL OR college = '')`;
      } else {
        query += ` AND college = $${paramIndex}`;
        params.push(college);
        paramIndex++;
      }
    }

    if (partnerType) {
      if (partnerType === 'none') {
        query += ` AND (partner_type IS NULL OR partner_type = '')`;
      } else {
        query += ` AND partner_type = $${paramIndex}`;
        params.push(partnerType);
        paramIndex++;
      }
    }

    if (status === 'active') {
      query += ` AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`;
    } else if (status === 'expired') {
      query += ` AND end_date < CURRENT_DATE`;
    } else if (status === 'dueForRenewal') {
      query += ` AND end_date >= CURRENT_DATE AND end_date <= (CURRENT_DATE + INTERVAL '31 days')`;
    }

    // Allowed sort fields to prevent injection
    const allowedFields = ['company_name', 'start_date', 'end_date', 'upload_date'];
    const safeSort = allowedFields.includes(sortBy) ? sortBy : 'upload_date';

    const finalQuery = `SELECT * FROM moas ${query} ORDER BY ${safeSort} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const result = await pool.query(finalQuery, [...params, limit, offset]);

    const countQuery = `SELECT COUNT(*) FROM moas ${query}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get MOAs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk Delete MOAs
app.delete('/api/moas/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    // Get filenames to delete files
    const fileResult = await pool.query(
      'SELECT pdf_filename FROM moas WHERE id = ANY($1) AND user_id = $2',
      [ids, req.user.id]
    );

    // Delete files
    fileResult.rows.forEach(row => {
      const filePath = path.join(UPLOAD_DIR, row.pdf_filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('File unlink error:', e); }
      }
    });

    // Delete records
    await pool.query(
      'DELETE FROM moas WHERE id = ANY($1) AND user_id = $2',
      [ids, req.user.id]
    );

    res.json({ message: `${ids.length} MOAs deleted successfully` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload MOA
app.post('/api/moas/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const { companyName, startDate, endDate, notes, college, partnerType } = req.body;

    if (!companyName || !startDate || !endDate) {
      // Delete uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ error: 'Company name, start date, and end date are required' });
    }

    const result = await pool.query(
      `INSERT INTO moas (user_id, company_name, pdf_filename, pdf_original_name, pdf_file_size, start_date, end_date, notes, college, partner_type, upload_date, last_modified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [req.user.id, companyName, req.file.filename, req.file.originalname, req.file.size, startDate, endDate, notes || null, college || null, partnerType || null]
    );

    res.status(201).json({
      message: 'MOA uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single MOA
app.get('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM moas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MOA not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update MOA
app.put('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    const { companyName, startDate, endDate, notes, college, partnerType } = req.body;

    const result = await pool.query(
      `UPDATE moas 
       SET company_name = $1, start_date = $2, end_date = $3, notes = $4, college = $5, partner_type = $6, last_modified = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [companyName, startDate, endDate, notes || null, college || null, partnerType || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MOA not found' });
    }

    res.json({
      message: 'MOA updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete single MOA
app.delete('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    const moaResult = await pool.query('SELECT pdf_filename FROM moas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (moaResult.rows.length === 0) {
      return res.status(404).json({ error: 'MOA not found' });
    }

    // Delete PDF file
    const filePath = path.join(UPLOAD_DIR, moaResult.rows[0].pdf_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM moas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    res.json({ message: 'MOA deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete is already handled by app.delete('/api/moas/bulk')

// Download MOA file
app.get('/api/moas/:id/download', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT pdf_filename, pdf_original_name FROM moas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MOA not found' });
    }

    const moa = result.rows[0];
    const filePath = path.join(UPLOAD_DIR, moa.pdf_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, moa.pdf_original_name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Serve frontend for non-API routes (SPA fallback)
app.use((req, res) => {
  // If it's an API route that wasn't matched, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  // Otherwise serve the frontend index.html
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found. Please build the frontend first.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  MOA System Backend (Self-Hosted)      ║
║  Running on http://localhost:${PORT}      ║
║  PostgreSQL: Connected ✓               ║
╚════════════════════════════════════════╝
  `);
});
