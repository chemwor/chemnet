-- ════════════════════════════════════════════════════════════════════════
-- ChemFeed v2 · Activity events + likes (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- A single chronological activity stream of what member nodes have done, plus
-- likes. Activity rows and like-notifications are written only by SECURITY
-- DEFINER triggers; clients can never insert them. Feed visibility (public
-- profile + no block) is enforced by RLS, not the client.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists platform.activity (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,        -- blog|photo|review|food|travel|carmod|project|music|digest|wishlist
  app text not null,         -- APP_REGISTRY id to open (blog, pictures, reviews, ...)
  item_id text not null,     -- the source row id in the members.* table
  title text,
  preview text,              -- thumbnail url OR short snippet (nullable)
  created_at timestamptz default now()
);
create index if not exists activity_actor_idx on platform.activity (actor_id, created_at desc);

alter table platform.activity enable row level security;
drop policy if exists "activity_read_public_unblocked" on platform.activity;
create policy "activity_read_public_unblocked" on platform.activity for select using (
  exists (select 1 from platform.profiles p where p.id = activity.actor_id and p.is_public)
  and not platform.is_blocked(auth.uid(), actor_id)
);
-- No client INSERT policy → only the trigger (SECURITY DEFINER) writes activity.
grant select on platform.activity to anon, authenticated;

-- One mapping for all member content tables. Reads fields generically via
-- to_jsonb(NEW) so it is safe across differing row shapes. Adding an app later
-- = add a `when` branch + a trigger.
create or replace function platform.on_content_activity() returns trigger
language plpgsql security definer set search_path = members, platform, public
as $$
declare
  j jsonb := to_jsonb(NEW);
  v_kind text; v_app text; v_title text; v_preview text;
begin
  if coalesce((j->>'is_hidden')::boolean, false) then return NEW; end if;
  case TG_TABLE_NAME
    when 'posts' then
      if coalesce((j->>'published')::boolean, true) = false then return NEW; end if;
      v_kind := 'blog'; v_app := 'blog'; v_title := j->>'title'; v_preview := left(coalesce(j->>'content',''), 140);
    when 'photos'         then v_kind := 'photo';    v_app := 'pictures';    v_title := j->>'title';       v_preview := j->>'url';
    when 'reviews'        then v_kind := 'review';   v_app := 'reviews';     v_title := j->>'title';       v_preview := j->>'poster';
    when 'food_items'     then v_kind := 'food';     v_app := 'restaurants'; v_title := j->>'name';        v_preview := j->>'icon';
    when 'travel_log'     then v_kind := 'travel';   v_app := 'trips';       v_title := j->>'destination'; v_preview := j->>'icon';
    when 'car_mods'       then v_kind := 'carmod';   v_app := 'carmods';     v_title := j->>'name';        v_preview := null;
    when 'projects'       then v_kind := 'project';  v_app := 'projects';    v_title := j->>'name';        v_preview := j->>'tagline';
    when 'music_tracks'   then v_kind := 'music';    v_app := 'music';       v_title := j->>'name';        v_preview := j->>'artist';
    when 'digest_entries' then v_kind := 'digest';   v_app := 'digest';      v_title := j->>'title';       v_preview := j->>'note';
    when 'wishlist_items' then v_kind := 'wishlist'; v_app := 'wishlist';    v_title := j->>'name';        v_preview := j->>'image';
    else return NEW;
  end case;
  insert into platform.activity (actor_id, kind, app, item_id, title, preview)
  values ((j->>'user_id')::uuid, v_kind, v_app, j->>'id', v_title, v_preview);
  return NEW;
end;
$$;

do $$
declare t text;
  tbls text[] := array['posts','photos','reviews','food_items','travel_log','car_mods','projects','music_tracks','digest_entries','wishlist_items'];
begin
  foreach t in array tbls loop
    execute format('drop trigger if exists trg_activity on members.%I', t);
    execute format('create trigger trg_activity after insert on members.%I for each row execute function platform.on_content_activity()', t);
  end loop;
end$$;

-- Feed view: a follower's stream (public + not-blocked enforced by activity RLS
-- under security_invoker; this view adds the followee filter + actor profile).
create or replace view platform.activity_feed
with (security_invoker = true) as
select a.id, a.actor_id, a.kind, a.app, a.item_id, a.title, a.preview, a.created_at,
       pr.handle, pr.display_name, pr.avatar_url
from platform.activity a
join platform.profiles pr on pr.id = a.actor_id
where a.actor_id in (select followee_id from platform.follows where follower_id = auth.uid());
grant select on platform.activity_feed to anon, authenticated;

-- ── Likes ──
create table if not exists platform.reactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,   -- 'activity' (reusable for items later)
  target_id text not null,
  created_at timestamptz default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists reactions_target_idx on platform.reactions (target_type, target_id);
alter table platform.reactions enable row level security;
drop policy if exists "reactions_read" on platform.reactions;
create policy "reactions_read" on platform.reactions for select using (true);
drop policy if exists "reactions_insert_own" on platform.reactions;
create policy "reactions_insert_own" on platform.reactions for insert with check (user_id = auth.uid());
drop policy if exists "reactions_delete_own" on platform.reactions;
create policy "reactions_delete_own" on platform.reactions for delete using (user_id = auth.uid());
grant select on platform.reactions to anon;
grant select, insert, delete on platform.reactions to authenticated;

-- Notify the liked activity's owner (notify() skips self + blocked).
create or replace function platform.on_reaction_notify() returns trigger
language plpgsql security definer set search_path = platform, public
as $$
declare v_owner uuid;
begin
  if NEW.target_type = 'activity' then
    select actor_id into v_owner from platform.activity where id = NEW.target_id::bigint;
    if v_owner is not null then
      perform platform.notify(v_owner, NEW.user_id, 'like', jsonb_build_object('activity_id', NEW.target_id));
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_reaction_notify on platform.reactions;
create trigger trg_reaction_notify after insert on platform.reactions
  for each row execute function platform.on_reaction_notify();

-- Realtime for live feed updates (RLS still applies to delivered rows).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='platform' and tablename='activity') then
    alter publication supabase_realtime add table platform.activity;
  end if;
end$$;

-- ── Backfill activity from existing public member content ──
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'blog', 'blog', id::text, title, left(coalesce(content,''),140), created_at
  from members.posts where coalesce(is_hidden,false)=false and coalesce(published,true)=true;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'photo', 'pictures', id::text, title, url, created_at
  from members.photos where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'review', 'reviews', id::text, title, poster, created_at
  from members.reviews where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'food', 'restaurants', id::text, name, icon, created_at
  from members.food_items where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'travel', 'trips', id::text, destination, icon, created_at
  from members.travel_log where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'carmod', 'carmods', id::text, name, null, created_at
  from members.car_mods where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'project', 'projects', id::text, name, tagline, created_at
  from members.projects where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'music', 'music', id::text, name, artist, created_at
  from members.music_tracks where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'digest', 'digest', id::text, title, note, created_at
  from members.digest_entries where coalesce(is_hidden,false)=false;
insert into platform.activity (actor_id, kind, app, item_id, title, preview, created_at)
select user_id, 'wishlist', 'wishlist', id::text, name, image, created_at
  from members.wishlist_items where coalesce(is_hidden,false)=false;
