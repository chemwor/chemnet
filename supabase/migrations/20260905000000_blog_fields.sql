-- ════════════════════════════════════════════════════════════════════════
-- Blog redesign · optional post fields (ADDITIVE — members only)
-- ════════════════════════════════════════════════════════════════════════
-- Powers the LiveJournal-style meta header (mood / now playing) and the tag
-- cloud + archive. Nullable, so the redesign renders fine before they are set.
-- Eric's public.blog_posts is intentionally NOT altered; the Blog reads these
-- defensively and omits them on the flagship. Mirroring onto public.blog_posts
-- is an owner-approved additive change Eric can opt into later.
-- ════════════════════════════════════════════════════════════════════════
alter table members.posts add column if not exists mood text;
alter table members.posts add column if not exists now_playing text;
alter table members.posts add column if not exists tags text[] default '{}';
