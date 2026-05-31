-- ════════════════════════════════════════════════════════════════════════
-- Phase 3 · Reports + content hiding + suspension (ADDITIVE — never public.*)
-- ════════════════════════════════════════════════════════════════════════
-- Reports: anyone authed inserts; only platform.is_admin() reads/updates.
-- Content hiding: each member content table gets is_hidden; read policies hide
-- such rows from everyone except the owner and admins. Admins act via
-- SECURITY DEFINER functions so they can touch rows they don't own.
-- ════════════════════════════════════════════════════════════════════════

-- ── Reports RLS (recreate Phase 0 policies via is_admin) ──
drop policy if exists "reports_insert_self" on platform.reports;
create policy "reports_insert_self" on platform.reports for insert with check (reporter_id = auth.uid());
drop policy if exists "reports_admin_read" on platform.reports;
create policy "reports_admin_read" on platform.reports for select using (platform.is_admin());
drop policy if exists "reports_admin_update" on platform.reports;
create policy "reports_admin_update" on platform.reports for update using (platform.is_admin()) with check (platform.is_admin());
grant insert on platform.reports to authenticated;

-- ── Suspension flag on profiles ──
alter table platform.profiles add column if not exists suspended boolean not null default false;

-- ── is_hidden on every member content table + hidden-aware read policy ──
do $$
declare
  t text;
  content_tables text[] := array[
    'posts','photos','reviews','food_items','digest_entries',
    'board_threads','board_posts','wishlist_items','car_mods',
    'travel_log','projects','music_tracks'
  ];
begin
  foreach t in array content_tables loop
    execute format('alter table members.%I add column if not exists is_hidden boolean not null default false', t);
    execute format('alter table members.%I add column if not exists hidden_reason text', t);

    execute format('drop policy if exists "read_public_or_own" on members.%I', t);
    execute format(
      $f$create policy "read_public_or_own" on members.%1$I for select using (
        (is_hidden = false or user_id = auth.uid() or platform.is_admin())
        and (
          user_id = auth.uid()
          or platform.is_admin()
          or exists (select 1 from platform.profiles p where p.id = members.%1$I.user_id and p.is_public)
        )
      )$f$, t);
  end loop;
end$$;

-- guestbook_entries (owner column is profile_id)
alter table members.guestbook_entries add column if not exists is_hidden boolean not null default false;
alter table members.guestbook_entries add column if not exists hidden_reason text;
drop policy if exists "read_book" on members.guestbook_entries;
create policy "read_book" on members.guestbook_entries for select using (
  (is_hidden = false or profile_id = auth.uid() or platform.is_admin())
  and (
    profile_id = auth.uid()
    or platform.is_admin()
    or exists (select 1 from platform.profiles p where p.id = profile_id and p.is_public)
  )
);

-- ════════════════════════════════════════════════════════════════════════
-- Admin moderation actions (SECURITY DEFINER; gated by is_admin())
-- ════════════════════════════════════════════════════════════════════════

create or replace function platform.mod_set_hidden(
  p_table text, p_id bigint, p_hidden boolean, p_reason text default null
) returns void
language plpgsql security definer set search_path = members, platform, public
as $$
begin
  if not platform.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if p_table not in (
    'posts','photos','reviews','food_items','digest_entries','board_threads','board_posts',
    'wishlist_items','car_mods','travel_log','projects','music_tracks','guestbook_entries'
  ) then raise exception 'invalid_table'; end if;
  execute format('update members.%I set is_hidden = $1, hidden_reason = $2 where id = $3', p_table)
    using p_hidden, p_reason, p_id;
end;
$$;
grant execute on function platform.mod_set_hidden(text, bigint, boolean, text) to authenticated;

create or replace function platform.mod_set_suspended(p_user_id uuid, p_suspended boolean) returns void
language plpgsql security definer set search_path = platform, public
as $$
begin
  if not platform.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  -- Suspending also unpublishes the node; unsuspending leaves it for the owner to re-publish.
  update platform.profiles
    set suspended = p_suspended,
        is_public = case when p_suspended then false else is_public end
    where id = p_user_id;
end;
$$;
grant execute on function platform.mod_set_suspended(uuid, boolean) to authenticated;

create or replace function platform.mod_resolve_report(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = platform, public
as $$
begin
  if not platform.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  update platform.reports set status = p_status where id = p_id;
end;
$$;
grant execute on function platform.mod_resolve_report(bigint, text) to authenticated;

-- Admin-facing report queue joined to reporter handle (admins only via RLS).
create or replace view platform.reports_view
with (security_invoker = true) as
select r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
       pr.handle as reporter_handle
from platform.reports r
left join platform.profiles pr on pr.id = r.reporter_id;
grant select on platform.reports_view to authenticated;
