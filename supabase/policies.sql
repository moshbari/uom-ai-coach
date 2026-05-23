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
