import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Dynamically allow the requesting origin to bypass strictly matching trailing slashes
    callback(null, origin || true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// Path normalization middleware for Vercel
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  // Ensure we don't have double slashes
  req.url = req.url.replace(/\/+/g, '/');
  if (req.url === '') req.url = '/';
  next();
});

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

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Store user metadata in users table
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    const token = jwt.sign(
      { id: authData.user.id, email, username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: authData.user.id,
        email,
        username
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const token = jwt.sign(
      { id: authData.user.id, email, username: userData.username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: authData.user.id,
        email,
        username: userData.username
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ========================
// MOA ROUTES
// ========================

// Get Presigned Upload URL
app.post('/moas/upload-url', authenticateToken, async (req, res) => {
  try {
    const { originalName } = req.body;
    if (!originalName) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from('moas')
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error('Supabase signed URL error:', error);
      return res.status(500).json({ error: 'Failed to generate upload URL' });
    }

    res.json({ signedUrl: data.signedUrl, fileName: data.path || fileName });
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'URL generation failed' });
  }
});

// Create MOA record after upload
app.post('/api/moas', authenticateToken, async (req, res) => {
  try {
    const { companyName, startDate, endDate, notes, college, partnerType, fileName, originalName, fileSize } = req.body;

    if (!fileName || !originalName) {
      return res.status(400).json({ error: 'File details missing' });
    }

    // Create MOA record
    const { data: moa, error: dbError } = await supabase
      .from('moas')
      .insert({
        user_id: req.user.id,
        company_name: companyName || 'Unnamed Company',
        pdf_filename: fileName,
        pdf_original_name: originalName,
        pdf_file_size: fileSize || 0,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
        notes: notes || '',
        college: college || null,
        partner_type: partnerType || null,
        upload_date: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return res.status(500).json({ error: 'Failed to create MOA record' });
    }

    res.json(moa);
  } catch (error) {
    console.error('Record creation error:', error);
    res.status(500).json({ error: 'Record creation failed' });
  }
});

// Get MOAs list
app.get('/api/moas', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'upload_date';
    const sortOrder = (req.query.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'asc' : 'desc';

    const { search, college, partnerType, status } = req.query;

    let query = supabase
      .from('moas')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    // Apply filters
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,notes.ilike.%${search}%,pdf_original_name.ilike.%${search}%`);
    }

    if (college && college !== 'none') {
      query = query.eq('college', college);
    } else if (college === 'none') {
      query = query.is('college', null);
    }

    if (partnerType && partnerType !== 'none') {
      query = query.eq('partner_type', partnerType);
    } else if (partnerType === 'none') {
      query = query.is('partner_type', null);
    }

    if (status === 'active') {
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('start_date', today).gte('end_date', today);
    } else if (status === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('end_date', today);
    } else if (status === 'dueForRenewal') {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('end_date', today).lte('end_date', thirtyDaysFromNow);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: moas, count: total, error } = await query;

    if (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: 'Failed to fetch MOAs' });
    }

    res.json({
      data: moas || [],
      pagination: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to list MOAs' });
  }
});

// Search MOAs
app.get('/api/moas/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { data: moas, error } = await supabase
      .from('moas')
      .select('*')
      .eq('user_id', req.user.id)
      .or(`company_name.ilike.%${q}%,pdf_original_name.ilike.%${q}%,notes.ilike.%${q}%`)
      .order('upload_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Search failed' });
    }

    res.json(moas || []);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Filter MOAs
app.post('/api/moas/filter', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, sortBy = 'upload_date', sortOrder = 'DESC', filters } = req.body;

    const validSortFields = ['company_name', 'start_date', 'end_date', 'upload_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'upload_date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';

    let query = supabase
      .from('moas')
      .select('*')
      .eq('user_id', req.user.id);

    // Apply filters
    if (filters?.status === 'active') {
      query = query
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);
    } else if (filters?.status === 'expired') {
      query = query.lt('end_date', new Date().toISOString().split('T')[0]);
    }

    if (filters?.college) {
      query = query.eq('college', filters.college);
    }

    if (filters?.partnerType) {
      query = query.eq('partner_type', filters.partnerType);
    }

    // Get total count
    const { count: total } = await supabase
      .from('moas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Apply sorting and pagination
    const { data: moas, error } = await query
      .order(sortField, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Filter failed' });
    }

    res.json({
      moas: moas || [],
      total: total || 0
    });
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Filter failed' });
  }
});

// Get MOA by ID
app.get('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    const { data: moa, error } = await supabase
      .from('moas')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !moa) {
      return res.status(404).json({ error: 'MOA not found' });
    }

    res.json(moa);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch MOA' });
  }
});

// Update MOA
app.put('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    const { companyName, startDate, endDate, notes, college, partnerType } = req.body;

    // Verify ownership
    const { data: moa } = await supabase
      .from('moas')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!moa) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: updated, error } = await supabase
      .from('moas')
      .update({
        company_name: companyName,
        start_date: startDate,
        end_date: endDate,
        notes,
        college,
        partner_type: partnerType,
        last_modified: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Update failed' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete MOA
app.delete('/api/moas/:id', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const { data: moa } = await supabase
      .from('moas')
      .select('pdf_filename')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!moa) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete PDF from storage
    await supabase.storage
      .from('moas')
      .remove([moa.pdf_filename]);

    // Delete record
    const { error } = await supabase
      .from('moas')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Delete failed' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Delete multiple MOAs
app.post('/api/moas/delete-multiple', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    // Get all MOAs for deletion to verify ownership
    const { data: moas } = await supabase
      .from('moas')
      .select('pdf_filename')
      .in('id', ids)
      .eq('user_id', req.user.id);

    if (!moas || moas.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or no MOAs found' });
    }

    // Delete PDFs from storage
    const filenames = moas.map(m => m.pdf_filename);
    await supabase.storage
      .from('moas')
      .remove(filenames);

    // Delete records
    const { error } = await supabase
      .from('moas')
      .delete()
      .in('id', ids);

    if (error) {
      return res.status(500).json({ error: 'Bulk delete failed' });
    }

    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// Download PDF
app.get('/api/moas/:id/download', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const { data: moa } = await supabase
      .from('moas')
      .select('pdf_filename, pdf_original_name')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!moa) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get signed URL
    const { data } = await supabase.storage
      .from('moas')
      .createSignedUrl(moa.pdf_filename, 3600);

    if (!data?.signedUrl) {
      return res.status(500).json({ error: 'Failed to generate download link' });
    }

    res.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ MOA System Backend running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
});

export default app;
