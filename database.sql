-- MOA System Supabase Database Schema

-- Create users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create MOAs table
CREATE TABLE IF NOT EXISTS moas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  pdf_filename TEXT NOT NULL,
  pdf_original_name TEXT NOT NULL,
  pdf_file_size INTEGER,
  pdf_storage_path TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  college TEXT,
  partner_type TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS moas_user_id ON moas(user_id);
CREATE INDEX IF NOT EXISTS moas_company_name ON moas(company_name);
CREATE INDEX IF NOT EXISTS moas_start_date ON moas(start_date);
CREATE INDEX IF NOT EXISTS moas_end_date ON moas(end_date);
CREATE INDEX IF NOT EXISTS moas_upload_date ON moas(upload_date);

-- Enable RLS on MOAs
ALTER TABLE moas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own MOAs
CREATE POLICY "Users can read own MOAs" ON moas
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own MOAs
CREATE POLICY "Users can insert own MOAs" ON moas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own MOAs
CREATE POLICY "Users can update own MOAs" ON moas
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own MOAs
CREATE POLICY "Users can delete own MOAs" ON moas
  FOR DELETE USING (auth.uid() = user_id);

-- Enable storage policy for MOAs bucket
-- First create the bucket if it doesn't exist via Supabase dashboard
-- Then apply these policies:

-- Storage policy: Users can upload PDFs to their own folder
CREATE POLICY "Users can upload own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'moas' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can read their own PDFs
CREATE POLICY "Users can read own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'moas' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can delete their own PDFs
CREATE POLICY "Users can delete own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'moas' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_moas_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_modified
CREATE TRIGGER moas_last_modified_trigger
BEFORE UPDATE ON moas
FOR EACH ROW
EXECUTE FUNCTION update_moas_last_modified();
