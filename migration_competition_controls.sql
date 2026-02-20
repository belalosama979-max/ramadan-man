-- Migration: Competition Controls
-- 1. game_settings (single-row config)
-- 2. active_sessions (multi-device prevention)
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. GAME SETTINGS TABLE (Single-Row Pattern)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Enforces single row
  show_winner boolean NOT NULL DEFAULT false,
  current_question_id uuid REFERENCES public.questions(id)
);

-- Insert the only row (if it doesn't exist)
INSERT INTO public.game_settings (id, show_winner, current_question_id)
VALUES (1, false, null)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read game_settings" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Everyone can update game_settings" ON public.game_settings FOR UPDATE USING (true);

-- ============================================================
-- 2. ACTIVE SESSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  session_id text NOT NULL UNIQUE,
  last_seen timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed to check if name is taken)
CREATE POLICY "Enable read for all" ON public.active_sessions FOR SELECT USING (true);

-- Anyone can insert their own session
CREATE POLICY "Enable insert for all" ON public.active_sessions FOR INSERT WITH CHECK (true);

-- Anyone can update (heartbeat) — restricted by session_id in app logic
CREATE POLICY "Enable update for all" ON public.active_sessions FOR UPDATE USING (true);

-- Anyone can delete their own session — restricted by session_id in app logic
CREATE POLICY "Enable delete for all" ON public.active_sessions FOR DELETE USING (true);
