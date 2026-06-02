-- ════════════════════════════════════════════════════════════════════════
-- Onboarding wizard · optional profile fields (ADDITIVE — platform.profiles)
-- ════════════════════════════════════════════════════════════════════════
-- The setup wizard's "About starter" + the per-person About template store a
-- few optional, nullable bits beyond display_name / bio / avatar_url. All
-- editable forever in About / Customize; empty fields just hide on the profile.
-- platform.* only — public.* is untouched. Existing RLS (own-row update via
-- profiles_update_own) already governs writes, so no policy changes needed.
-- ════════════════════════════════════════════════════════════════════════
alter table platform.profiles add column if not exists location text;
alter table platform.profiles add column if not exists tagline  text;
alter table platform.profiles add column if not exists links    text[] default '{}';
