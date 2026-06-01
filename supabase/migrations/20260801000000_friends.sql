-- ════════════════════════════════════════════════════════════════════════
-- Phase 5 · Friends graph (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- A MUTUAL, accepted friendship graph (distinct from one-directional follows).
-- Two paths to friendship: a request the other accepts, or redeeming an invite
-- code. The flagship hub owner (Eric) auto-friends every member; everyone else
-- adds friends manually. RLS is the boundary.
-- ════════════════════════════════════════════════════════════════════════

-- Resolve the flagship/hub owner's auth id (first platform admin).
create or replace function platform.flagship_owner_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select u.id from auth.users u
  where u.email in (select email from public.admin_users)
  order by u.created_at asc
  limit 1
$$;
grant execute on function platform.flagship_owner_id() to anon, authenticated;

-- ── Friendships ──
create table if not exists platform.friendships (
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index if not exists friendships_addressee_idx on platform.friendships (addressee_id);
alter table platform.friendships enable row level security;

-- See only friendships you're part of.
drop policy if exists "friendships_select_own" on platform.friendships;
create policy "friendships_select_own" on platform.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());
-- Send a request (pending, as yourself, not across a block).
drop policy if exists "friendships_insert_request" on platform.friendships;
create policy "friendships_insert_request" on platform.friendships for insert
  with check (requester_id = auth.uid() and status = 'pending'
              and not platform.is_blocked(requester_id, addressee_id));
-- Accept: only the addressee may flip their incoming request to accepted.
drop policy if exists "friendships_accept" on platform.friendships;
create policy "friendships_accept" on platform.friendships for update
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid() and status = 'accepted');
-- Decline / unfriend: either party can remove the row.
drop policy if exists "friendships_delete_either" on platform.friendships;
create policy "friendships_delete_either" on platform.friendships for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());
grant select, insert, update, delete on platform.friendships to authenticated;

create or replace function platform.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = platform, public
as $$
  select exists (
    select 1 from platform.friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  )
$$;
grant execute on function platform.are_friends(uuid, uuid) to anon, authenticated;

-- ── Invite codes ──
create table if not exists platform.invite_codes (
  code text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table platform.invite_codes enable row level security;
drop policy if exists "invite_codes_own" on platform.invite_codes;
create policy "invite_codes_own" on platform.invite_codes for select using (owner_id = auth.uid());
grant select on platform.invite_codes to authenticated;

-- Get (or lazily create) my personal invite code.
create or replace function platform.my_invite_code() returns text
language plpgsql security definer set search_path = platform, public
as $$
declare v_me uuid := auth.uid(); v_code text;
begin
  if v_me is null then raise exception 'auth'; end if;
  select code into v_code from platform.invite_codes where owner_id = v_me limit 1;
  if v_code is not null then return v_code; end if;
  v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  insert into platform.invite_codes (code, owner_id) values (v_code, v_me);
  return v_code;
end;
$$;
grant execute on function platform.my_invite_code() to authenticated;

-- Redeem someone's code → instant mutual friendship. SECURITY DEFINER so the
-- redeemer can resolve a code they don't own (without selecting others' rows).
create or replace function platform.redeem_invite(p_code text) returns text
language plpgsql security definer set search_path = platform, public
as $$
declare v_me uuid := auth.uid(); v_owner uuid;
begin
  if v_me is null then raise exception 'auth'; end if;
  select owner_id into v_owner from platform.invite_codes where code = p_code;
  if v_owner is null then raise exception 'invalid_code'; end if;
  if v_owner = v_me then raise exception 'self'; end if;
  if platform.is_blocked(v_me, v_owner) then raise exception 'blocked'; end if;
  insert into platform.friendships (requester_id, addressee_id, status)
    values (v_owner, v_me, 'accepted')
    on conflict (requester_id, addressee_id) do update set status = 'accepted';
  update platform.friendships set status = 'accepted'
    where requester_id = v_me and addressee_id = v_owner;
  return v_owner::text;
end;
$$;
grant execute on function platform.redeem_invite(text) to authenticated;

-- ── Notifications: friend_request (on pending insert) + friend_accept (on accept) ──
create or replace function platform.on_friendship_notify() returns trigger
language plpgsql security definer set search_path = platform, public
as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'pending' then
    perform platform.notify(NEW.addressee_id, NEW.requester_id, 'friend_request', '{}'::jsonb);
  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status is distinct from 'accepted' then
    perform platform.notify(NEW.requester_id, NEW.addressee_id, 'friend_accept', '{}'::jsonb);
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_friendship_notify on platform.friendships;
create trigger trg_friendship_notify after insert or update on platform.friendships
  for each row execute function platform.on_friendship_notify();

-- ── The hub auto-friends every member (accepted) — Eric is everyone's friend ──
create or replace function platform.on_profile_autofriend() returns trigger
language plpgsql security definer set search_path = platform, public
as $$
declare v_owner uuid := platform.flagship_owner_id();
begin
  if v_owner is not null and v_owner <> NEW.id then
    insert into platform.friendships (requester_id, addressee_id, status)
    values (v_owner, NEW.id, 'accepted')
    on conflict (requester_id, addressee_id) do nothing;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_profile_autofriend on platform.profiles;
create trigger trg_profile_autofriend after insert on platform.profiles
  for each row execute function platform.on_profile_autofriend();

-- Backfill: friend the hub with every existing member.
do $$
declare v_owner uuid := platform.flagship_owner_id();
begin
  if v_owner is not null then
    insert into platform.friendships (requester_id, addressee_id, status)
    select v_owner, p.id, 'accepted' from platform.profiles p where p.id <> v_owner
    on conflict (requester_id, addressee_id) do nothing;
  end if;
end$$;
