-- ====================================================================
-- Phase 2 Migration: Make MOA Effectivity Dates Optional
-- ====================================================================

-- Drop NOT NULL constraints from start_date and end_date columns in moas table
ALTER TABLE moas ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE moas ALTER COLUMN end_date DROP NOT NULL;
