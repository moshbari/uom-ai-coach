-- UOM AI Coach — Supabase schema
-- Run this in Supabase SQL editor after creating the project.
-- All tables use Row Level Security so members only see their own data.

-- =========================
-- profiles
-- One row per signed-up member. Linked to auth.users.
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  current_tier text not null default 'bronze',
  bronze_day int not null default 1,
  streak int not null default 0,
  last_win_date date,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- checkins
-- One row per day per member (3-tap morning check-in).
-- =========================
create table if not exists public.checkins (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  time_avail text,    -- '15' | '30' | '60'
  energy text,        -- 'low' | 'mid' | 'high'
  mood text,          -- 'stuck' | 'ok' | 'fire'
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- =========================
-- completions
-- One row every time the member taps "Another win for a creator."
-- =========================
create table if not exists public.completions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null,
  day int,                  -- 1-14 for bronze, null for others
  completed_at timestamptz not null default now()
);

-- =========================
-- sparks
-- The Daily Spark log — one curiosity line per day.
-- =========================
create table if not exists public.sparks (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int,                  -- bronze day number when saved (nullable)
  line text not null,
  created_at timestamptz not null default now()
);

-- =========================
-- badges
-- Milestone badges earned (First Wave, Week 1 Done, Identity Shift, etc.)
-- =========================
create table if not exists public.badges (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,         -- e.g. 'first_wave', 'week_1_done', 'identity_shift'
  badge_label text not null,       -- e.g. 'First Wave — Day 3'
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- =========================
-- Indexes for admin dashboard speed
-- =========================
create index if not exists idx_completions_user_date on public.completions(user_id, completed_at desc);
create index if not exists idx_sparks_user_date on public.sparks(user_id, created_at desc);
create index if not exists idx_profiles_streak on public.profiles(streak desc);
create index if not exists idx_profiles_last_win on public.profiles(last_win_date);

-- =========================
-- updated_at trigger
-- =========================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================
-- Auto-create profile row on signup
-- =========================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
