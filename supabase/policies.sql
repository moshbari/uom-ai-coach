-- Row Level Security policies
-- These rules make sure members can only see/edit their own data.
-- Admin gets to see everyone.

alter table public.profiles    enable row level security;
alter table public.checkins    enable row level security;
alter table public.completions enable row level security;
alter table public.sparks      enable row level security;
alter table public.badges      enable row level security;

-- Helper: is this caller an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ===== profiles =====
drop policy if exists "members read own profile" on public.profiles;
create policy "members read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "members update own profile" on public.profiles;
create policy "members update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ===== checkins =====
drop policy if exists "members manage own checkins" on public.checkins;
create policy "members manage own checkins" on public.checkins
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ===== completions =====
drop policy if exists "members manage own completions" on public.completions;
create policy "members manage own completions" on public.completions
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ===== sparks =====
drop policy if exists "members manage own sparks" on public.sparks;
create policy "members manage own sparks" on public.sparks
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ===== badges =====
drop policy if exists "members read own badges" on public.badges;
create policy "members read own badges" on public.badges
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "members insert own badges" on public.badges;
create policy "members insert own badges" on public.badges
  for insert with check (auth.uid() = user_id);
