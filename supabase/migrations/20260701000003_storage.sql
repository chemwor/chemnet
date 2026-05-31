-- ════════════════════════════════════════════════════════════════════════
-- Phase 3 · Storage buckets + policies (ADDITIVE)
-- ════════════════════════════════════════════════════════════════════════
-- Fail-closed upload pipeline:
--   • `uploads`  — PRIVATE quarantine. Clients write only their own folder.
--   • avatars / wallpapers / photos / music — PUBLIC read, but NO client write.
--     Only the scan_upload Edge Function (service role, bypasses RLS) copies an
--     approved object into a public bucket. Nothing is public until scanned.
-- Path convention: {user_id}/...   (foldername[1] = the owner's uid)
-- Buckets also carry size + mime limits as defense-in-depth.
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('uploads',    'uploads',    false, 15728640, array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg']),
  ('avatars',    'avatars',    true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('wallpapers', 'wallpapers', true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('photos',     'photos',     true,   8388608, array['image/jpeg','image/png','image/webp','image/gif']),
  ('music',      'music',      true,  15728640, array['audio/mpeg','audio/mp4','audio/wav','audio/ogg'])
on conflict (id) do nothing;

-- ── Quarantine: owner reads/writes only their own {uid}/... folder ──
drop policy if exists "uploads_owner_all" on storage.objects;
create policy "uploads_owner_all" on storage.objects for all
  to authenticated
  using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Public buckets: anyone may READ; nobody may client-write (service role only) ──
drop policy if exists "public_assets_read" on storage.objects;
create policy "public_assets_read" on storage.objects for select
  using (bucket_id in ('avatars','wallpapers','photos','music'));

-- No insert/update/delete policies on the public buckets → all client writes are
-- denied by default. The scan_upload function uses the service-role key, which
-- bypasses RLS, so only scanned+approved assets ever reach a public bucket.
