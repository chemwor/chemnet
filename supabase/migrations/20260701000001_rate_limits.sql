-- ════════════════════════════════════════════════════════════════════════
-- Phase 3 · Rate limits on member inserts (ADDITIVE)
-- ════════════════════════════════════════════════════════════════════════
-- One generic BEFORE INSERT trigger reads thresholds from platform.rate_limits
-- (tune in one place) and raises 'rate_limit_exceeded:<kind>' when a user
-- exceeds N inserts in a rolling window. Normal usage is well under these.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists platform.rate_limits (
  kind text primary key,
  max_count int not null,
  window_seconds int not null
);

-- Tunable thresholds (rolling 1-hour windows).
insert into platform.rate_limits (kind, max_count, window_seconds) values
  ('posts', 20, 3600),
  ('guestbook', 30, 3600),
  ('messages', 30, 3600),
  ('follows', 120, 3600)
on conflict (kind) do update
  set max_count = excluded.max_count, window_seconds = excluded.window_seconds;

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
    when 'posts'             then v_kind := 'posts';     v_user_col := 'user_id';     v_user := NEW.user_id;
    when 'guestbook_entries' then v_kind := 'guestbook'; v_user_col := 'author_id';   v_user := NEW.author_id;
    when 'messages'          then v_kind := 'messages';  v_user_col := 'sender_id';   v_user := NEW.sender_id;
    when 'follows'           then v_kind := 'follows';   v_user_col := 'follower_id'; v_user := NEW.follower_id;
    else return NEW;
  end case;

  -- System / null-actor inserts (e.g. SysOp welcome mail) are unlimited.
  if v_user is null then return NEW; end if;

  select max_count, window_seconds into v_max, v_window
  from platform.rate_limits where kind = v_kind;
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

drop trigger if exists trg_rl_posts on members.posts;
create trigger trg_rl_posts before insert on members.posts
  for each row execute function platform.enforce_rate_limit();

drop trigger if exists trg_rl_guestbook on members.guestbook_entries;
create trigger trg_rl_guestbook before insert on members.guestbook_entries
  for each row execute function platform.enforce_rate_limit();

drop trigger if exists trg_rl_messages on members.messages;
create trigger trg_rl_messages before insert on members.messages
  for each row execute function platform.enforce_rate_limit();

drop trigger if exists trg_rl_follows on platform.follows;
create trigger trg_rl_follows before insert on platform.follows
  for each row execute function platform.enforce_rate_limit();
