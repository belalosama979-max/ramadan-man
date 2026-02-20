-- Migration: Add result_viewed column to submissions
-- Run this in the Supabase SQL editor

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS result_viewed boolean DEFAULT false;

-- Allow users to update their own submission's result_viewed flag
-- (RLS: update policy for submissions — previously missing)
CREATE POLICY "Enable update for all users" ON public.submissions
  FOR UPDATE USING (true);
