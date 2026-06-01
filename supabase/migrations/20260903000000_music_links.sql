-- ════════════════════════════════════════════════════════════════════════
-- Phase 6 · Music integrations (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- Per-node playlist URLs for the Music app's embed sections. Embeds only:
-- no API keys / OAuth / tokens. The owner pastes a SoundCloud and a Spotify
-- playlist URL in Customize; the app renders the official widgets so content
-- auto-syncs when the linked playlist changes. Eric's flagship URLs live in a
-- client constant (no public.* schema change).
-- ════════════════════════════════════════════════════════════════════════
alter table members.desktop_config add column if not exists soundcloud_url text;
alter table members.desktop_config add column if not exists spotify_url text;
