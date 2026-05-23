-- =============================================================
-- UOM AI Coach — Supabase schema
-- All tables use the `uom_` prefix so they NEVER collide with
-- anything else living in this Supabase project's public schema.
-- =============================================================

-- =========================
-- uom_profiles
-- One row per signed-up member. Linked to auth.users.
-- =========================
create table if not exists public.uom_profiles (
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
-- uom_checkins
-- One row per day per member (3-tap morning check-in).
-- =========================
create table if not exists public.uom_checkins (
  id bigserial primary key,
  user_id uuid not null references public.uom_profiles(id) on delete cascade,
  date date not null,
  time_avail text,   -- '15' | '30' | '60'
  energy text,       -- 'low' | 'mid' | 'high'
  mood text,         -- 'stuck' | 'ok' | 'fire'
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- =========================
-- uom_completions
-- One row every time member taps "Another win for a creator."
-- =========================
create table if not exists public.uom_completions (
  id bigserial primary key,
  user_id uuid not null references public.uom_profiles(id) on delete cascade,
  tier text not null,
  day int,                  -- 1-14 for bronze, null otherwise
  completed_at timestamptz not null default now()
);

-- =========================
-- uom_sparks
-- The Daily Spark log — one curiosity line per day.
-- =========================
create table if not exists public.uom_sparks (
  id bigserial primary key,
  user_id uuid not null references public.uom_profiles(id) on delete cascade,
  day int,                  -- bronze day number when saved (nullable)
  line text not null,
  created_at timestamptz not null default now()
);

-- =========================
-- uom_badges
-- Milestone badges (First Wave, Week 1 Done, Identity Shift, etc.)
-- =========================
create table if not exists public.uom_badges (
  id bigserial primary key,
  user_id uuid not null references public.uom_profiles(id) on delete cascade,
  badge_key text not null,        -- e.g. 'first_wave'
  badge_label text not null,      -- e.g. 'First Wave — Day 3'
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- =========================
-- Indexes
-- =========================
create index if not exists idx_uom_completions_user_date on public.uom_completions(user_id, completed_at desc);
create index if not exists idx_uom_sparks_user_date     on public.uom_sparks(user_id, created_at desc);
create index if not exists idx_uom_profiles_streak      on public.uom_profiles(streak desc);
create index if not exists idx_uom_profiles_last_win    on public.uom_profiles(last_win_date);

-- =========================
-- updated_at trigger
-- =========================
create or replace function public.uom_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists uom_profiles_set_updated_at on public.uom_profiles;
create trigger uom_profiles_set_updated_at
  before update on public.uom_profiles
  for each row execute function public.uom_set_updated_at();

-- =========================
-- Auto-create profile row on signup
-- =========================
create or replace function public.uom_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.uom_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists uom_on_auth_user_created on auth.users;
create trigger uom_on_auth_user_created
  after insert on auth.users
  for each row execute function public.uom_handle_new_user();
-- Row Level Security policies for UOM AI Coach tables only.
-- Members see only their own data. Admins (is_admin=true) see everyone.

alter table public.uom_profiles    enable row level security;
alter table public.uom_checkins    enable row level security;
alter table public.uom_completions enable row level security;
alter table public.uom_sparks      enable row level security;
alter table public.uom_badges      enable row level security;

-- Helper: is the caller an admin?
create or replace function public.uom_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from public.uom_profiles where id = auth.uid()),
    false
  );
$$;

-- ===== uom_profiles =====
drop policy if exists "uom members read own profile" on public.uom_profiles;
create policy "uom members read own profile" on public.uom_profiles
  for select using (auth.uid() = id or public.uom_is_admin());

drop policy if exists "uom members update own profile" on public.uom_profiles;
create policy "uom members update own profile" on public.uom_profiles
  for update using (auth.uid() = id);

-- ===== uom_checkins =====
drop policy if exists "uom members manage own checkins" on public.uom_checkins;
create policy "uom members manage own checkins" on public.uom_checkins
  for all using (auth.uid() = user_id or public.uom_is_admin())
  with check (auth.uid() = user_id);

-- ===== uom_completions =====
drop policy if exists "uom members manage own completions" on public.uom_completions;
create policy "uom members manage own completions" on public.uom_completions
  for all using (auth.uid() = user_id or public.uom_is_admin())
  with check (auth.uid() = user_id);

-- ===== uom_sparks =====
drop policy if exists "uom members manage own sparks" on public.uom_sparks;
create policy "uom members manage own sparks" on public.uom_sparks
  for all using (auth.uid() = user_id or public.uom_is_admin())
  with check (auth.uid() = user_id);

-- ===== uom_badges =====
drop policy if exists "uom members read own badges" on public.uom_badges;
create policy "uom members read own badges" on public.uom_badges
  for select using (auth.uid() = user_id or public.uom_is_admin());

drop policy if exists "uom members insert own badges" on public.uom_badges;
create policy "uom members insert own badges" on public.uom_badges
  for insert with check (auth.uid() = user_id);

-- Promote Mosh to admin (matches by email so it works after he signs up)
update public.uom_profiles set is_admin = true where email = 'engrmoshbari@gmail.com';
