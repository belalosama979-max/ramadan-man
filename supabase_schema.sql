-- Create tables for Ramadan Dal App

-- 1. Questions Table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  correct_answer text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- 2. Submissions Table
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  question_id uuid not null references public.questions(id),
  name text not null,
  normalized_name text not null,
  answer text not null,
  is_correct boolean not null,
  submitted_at timestamp with time zone default now()
);

-- 3. Row Level Security (RLS) - Optional but recommended
-- For this simple app, we can enable public access or set specific policies.
-- Here is a basic setup (Public Read/Write for simplicity, typically you'd want closer restrictions)

alter table public.questions enable row level security;
alter table public.submissions enable row level security;

-- Allow everyone to read questions
create policy "Enable read access for all users" on public.questions for select using (true);
-- Allow anon to insert/update questions (Admin) - In reality, you'd restrict this to auth users
create policy "Enable insert for all users" on public.questions for insert with check (true);
create policy "Enable update for all users" on public.questions for update using (true);

-- Allow everyone to read submissions (Admin uses this)
create policy "Enable read access for all users" on public.submissions for select using (true);
-- Allow anon to insert submissions (Users)
create policy "Enable insert for all users" on public.submissions for insert with check (true);
