-- MOA System - PostgreSQL Database Schema
-- For self-hosted deployment

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create MOAs table
CREATE TABLE IF NOT EXISTS moas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  pdf_filename VARCHAR(255) NOT NULL,
  pdf_original_name VARCHAR(255) NOT NULL,
  pdf_file_size INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  college VARCHAR(255),
  partner_type VARCHAR(255),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_moas_user_id ON moas(user_id);
CREATE INDEX IF NOT EXISTS idx_moas_company_name ON moas(company_name);
CREATE INDEX IF NOT EXISTS idx_moas_start_date ON moas(start_date);
CREATE INDEX IF NOT EXISTS idx_moas_end_date ON moas(end_date);
CREATE INDEX IF NOT EXISTS idx_moas_upload_date ON moas(upload_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create trigger to auto-update last_modified
CREATE OR REPLACE FUNCTION update_moas_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moas_last_modified_trigger
BEFORE UPDATE ON moas
FOR EACH ROW
EXECUTE FUNCTION update_moas_last_modified();

-- Optional: Seed data (remove in production)
-- INSERT INTO users (username, email, password_hash) VALUES
-- ('admin', 'admin@example.com', '$2a$10$...');
