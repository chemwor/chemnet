-- ════════════════════════════════════════════════════════════════════════
-- Multi-provider videos (ADDITIVE — members.videos)
-- ════════════════════════════════════════════════════════════════════════
-- The Videos app now accepts ANY video URL (YouTube, Vimeo, Google Drive, or a
-- direct/Storage file). parseVideoUrl() detects the provider on write; these
-- columns persist it so the player picks the right renderer (it also re-derives
-- from the URL at render time, so old rows with null provider still play).
-- ════════════════════════════════════════════════════════════════════════
alter table members.videos add column if not exists provider  text;
alter table members.videos add column if not exists thumbnail text;
