import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key if available to bypass RLS for server-side operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    callback(null, origin || true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ========================
// AUTHENTICATION ROUTES
// ========================

router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!supabase) return res.status(500).json({ error: 'Database connection not initialized' });

    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    if (existingUser) return res.status(409).json({ error: 'User already exists' });

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });

    await supabase.from('users').insert({
      id: authData.user.id,
      email,
      username,
      created_at: new Date().toISOString()
    });

    const token = jwt.sign({ id: authData.user.id, email, username }, jwtSecret, { expiresIn: '7d' });
    res.json({ user: { id: authData.user.id, email, username }, token });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (!supabase) return res.status(500).json({ error: 'Database connection not initialized' });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid credentials' });

    const { data: userData } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    const token = jwt.sign({ id: authData.user.id, email, username: userData.username }, jwtSecret, { expiresIn: '7d' });
    res.json({ user: { id: authData.user.id, email, username: userData.username }, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ========================
// MOA ROUTES
// ========================

router.post('/moas/upload-url', authenticateToken, async (req, res) => {
  try {
    const { originalName } = req.body;
    if (!originalName) return res.status(400).json({ error: 'Filename is required' });

    const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage.from('moas').createSignedUploadUrl(fileName);
    if (error) {
      console.error('Supabase Storage Error:', error);
      return res.status(500).json({ error: `Failed to generate upload URL: ${error.message}` });
    }

    res.json({ signedUrl: data.signedUrl, fileName: data.path || fileName });
  } catch (error) {
    console.error('URL Generation Catch Error:', error);
    res.status(500).json({ error: `URL generation failed: ${error.message}` });
  }
});

router.get('/moas', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, college, partnerType, status } = req.query;

    let query = supabase.from('moas').select('*', { count: 'exact' }).eq('user_id', req.user.id);
    if (search) query = query.or(`company_name.ilike.%${search}%,notes.ilike.%${search}%`);
    if (college && college !== 'none') query = query.eq('college', college);
    if (partnerType && partnerType !== 'none') query = query.eq('partner_type', partnerType);
    
    // Sort and Paginate
    query = query.order('upload_date', { ascending: false }).range(offset, offset + limit - 1);
    const { data: moas, count: total } = await query;

    res.json({ data: moas || [], pagination: { total: total || 0, page, limit } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list MOAs' });
  }
});

router.get('/moas/:id/download', authenticateToken, async (req, res) => {
  try {
    const { data: moa } = await supabase.from('moas').select('pdf_filename').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!moa) return res.status(403).json({ error: 'Unauthorized' });

    const { data } = await supabase.storage.from('moas').createSignedUrl(moa.pdf_filename, 3600);
    res.json({ url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// Diagnostics
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    diagnostics: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      env: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString() 
  });
});

// MULTI-MOUNT: The magic happens here
app.use('/api', router);
app.use('/', router);

// Start server (Local only)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`✅ MOA System Backend running on port ${PORT}`));
}

export default app;
