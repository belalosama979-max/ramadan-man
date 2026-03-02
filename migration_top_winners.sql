-- Migration: Add top_winners column to game_settings
-- Run this in your Supabase SQL Editor

ALTER TABLE public.game_settings 
ADD COLUMN IF NOT EXISTS top_winners jsonb DEFAULT NULL;

-- Ensure RLS policies are still intact for game_settings
-- (The existing policies for game_settings will automatically apply to this new column)
