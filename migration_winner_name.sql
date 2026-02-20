-- Migration: Add winner_name to game_settings
-- Run in Supabase SQL Editor

ALTER TABLE public.game_settings
ADD COLUMN IF NOT EXISTS winner_name text DEFAULT null;
