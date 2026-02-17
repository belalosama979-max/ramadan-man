-- Run this in your Supabase SQL Editor to ensure correct timezone handling

-- 1. Alter columns to be timestamptz (timezone aware) if they aren't already
-- This is safe to run even if they are already timestamptz
ALTER TABLE questions 
ALTER COLUMN start_time TYPE timestamptz USING start_time::timestamptz,
ALTER COLUMN end_time TYPE timestamptz USING end_time::timestamptz;

-- 2. Optional: Check the column types to confirm
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND column_name IN ('start_time', 'end_time');
