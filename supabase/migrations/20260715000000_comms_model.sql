-- ════════════════════════════════════════════════════════════════════════
-- Phase 4 · Final communication model (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- Mail (contact form → owner's real email), Messages (1:1 realtime chat on
-- members.messages), and a truly-open anonymous Guestbook on public nodes.
-- ════════════════════════════════════════════════════════════════════════

-- ── A. Mail: owner opt-out flag + audit log ──
alter table platform.profiles add column if not exists mail_enabled boolean not null default true;

create table if not exists members.mail_log (
  id bigint generated always as identity primary key,
  recipient_id uuid references auth.users(id) on delete cascade,   -- null for the flagship/admin contact
  from_email text,
  from_name text,
  subject text,
  status text,
  ip text,
  created_at timestamptz default now()
);
alter table members.mail_log enable row level security;
drop policy if exists "mail_log_read_own" on members.mail_log;
create policy "mail_log_read_own" on members.mail_log for select using (recipient_id = auth.uid());
-- No client INSERT policy → only the send_mail Edge Function (service role) writes.
grant select on members.mail_log to authenticated;
create index if not exists mail_log_ip_idx on members.mail_log (ip, created_at desc);
create index if not exists mail_log_recipient_idx on members.mail_log (recipient_id, created_at desc);

-- ── C. Guestbook: allow ANONYMOUS signing of a PUBLIC node (RLS is the gate) ──
-- author_id may be null (anonymous); the book's profile must be public; a
-- logged-in signer can't sign across a block. Length cap + rate limit below.
drop policy if exists "sign_any_book" on members.guestbook_entries;
create policy "sign_any_book" on members.guestbook_entries for insert with check (
  (author_id is null or author_id = auth.uid())
  and exists (select 1 from platform.profiles p where p.id = profile_id and p.is_public)
  and not (author_id is not null and platform.is_blocked(author_id, profile_id))
);

-- Body length cap (NOT VALID → only enforced on new/updated rows).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guestbook_body_len' and conrelid = 'members.guestbook_entries'::regclass
  ) then
    alter table members.guestbook_entries add constraint guestbook_body_len check (char_length(body) <= 1000) not valid;
  end if;
end$$;

-- ── B. Rate limit: anonymous guestbook signs are limited per BOOK (no signer id
-- to key on, and no request IP available in-trigger — keyed on profile_id). A
-- logged-in signer is still limited per author_id. (IP-level limits = future.)
create or replace function platform.enforce_rate_limit() returns trigger
language plpgsql security definer set search_path = members, platform, public
as $$
declare
  v_kind text;
  v_user uuid;
  v_user_col text;
  v_max int;
  v_window int;
  v_count int;
begin
  case TG_TABLE_NAME
    when 'posts'    then v_kind := 'posts';    v_user_col := 'user_id';     v_user := NEW.user_id;
    when 'messages' then v_kind := 'messages'; v_user_col := 'sender_id';   v_user := NEW.sender_id;
    when 'follows'  then v_kind := 'follows';  v_user_col := 'follower_id'; v_user := NEW.follower_id;
    when 'guestbook_entries' then
      v_kind := 'guestbook';
      if NEW.author_id is not null then v_user_col := 'author_id';  v_user := NEW.author_id;
      else                              v_user_col := 'profile_id'; v_user := NEW.profile_id;
      end if;
    else return NEW;
  end case;

  if v_user is null then return NEW; end if;

  select max_count, window_seconds into v_max, v_window from platform.rate_limits where kind = v_kind;
  if v_max is null then return NEW; end if;

  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - ($2 || '' seconds'')::interval',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, v_user_col
  ) into v_count using v_user, v_window;

  if v_count >= v_max then
    raise exception 'rate_limit_exceeded:%', v_kind using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

-- ── B. Realtime: stream members.messages to the 1:1 chat (RLS still applies) ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'members' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table members.messages;
  end if;
end$$;
