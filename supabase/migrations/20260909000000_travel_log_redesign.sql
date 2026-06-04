-- ════════════════════════════════════════════════════════════════════════
-- Travel Log redesign · schema parity across nodes
-- ════════════════════════════════════════════════════════════════════════
-- members.travel_log is canonical. We add the redesign's columns to it
-- (ADDITIVE — old destination/icon/summary/data columns stay for back-compat),
-- and create a NEW public.travel_log that mirrors the same shape for Eric's
-- flagship. This is an owner-approved, additive flagship table; NO existing
-- public.* table is altered.
-- ════════════════════════════════════════════════════════════════════════

-- ── Member side: add the redesign columns (additive). RLS already applied by
--    the members.* loop in 20260530000001 (read public-or-own, write own). ──
alter table members.travel_log add column if not exists country     text;
alter table members.travel_log add column if not exists place       text;
alter table members.travel_log add column if not exists flag        text;
alter table members.travel_log add column if not exists start_date  date;
alter table members.travel_log add column if not exists end_date    date;
alter table members.travel_log add column if not exists plan_items  jsonb not null default '[]'::jsonb;
alter table members.travel_log add column if not exists photo_urls  text[] not null default '{}';

-- ── Flagship side: NEW public.travel_log (mirror of the canonical shape) ──
create table if not exists public.travel_log (
  id bigint generated always as identity primary key,
  country text not null,
  place text,
  flag text,
  status text not null default 'planned' check (status in ('planned','visited')),
  start_date date,
  end_date date,
  notes text,
  plan_items jsonb not null default '[]'::jsonb,
  photo_urls text[] not null default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.travel_log enable row level security;

-- Public read; admin (email in admin_users) writes — Eric's existing pattern.
drop policy if exists "travel_read" on public.travel_log;
create policy "travel_read" on public.travel_log for select using (true);

drop policy if exists "travel_admin_insert" on public.travel_log;
create policy "travel_admin_insert" on public.travel_log for insert to authenticated
  with check (exists (select 1 from admin_users where email = auth.jwt()->>'email'));

drop policy if exists "travel_admin_update" on public.travel_log;
create policy "travel_admin_update" on public.travel_log for update to authenticated
  using (exists (select 1 from admin_users where email = auth.jwt()->>'email'));

drop policy if exists "travel_admin_delete" on public.travel_log;
create policy "travel_admin_delete" on public.travel_log for delete to authenticated
  using (exists (select 1 from admin_users where email = auth.jwt()->>'email'));
