-- ====================================================================
-- Phase 1 Migration: Extend users table for Student RBAC & Approval Queue
-- ====================================================================

-- 1. Add role, student_id, and approval_status columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student',
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';

-- 2. Grandfather existing administrative accounts
-- Sets existing staff accounts to 'admin' role and 'approved' status
UPDATE users 
SET role = 'admin', approval_status = 'approved' 
WHERE role = 'student' OR role IS NULL;
