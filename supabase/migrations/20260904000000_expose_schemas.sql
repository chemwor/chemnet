-- ════════════════════════════════════════════════════════════════════════
-- Expose the platform + members schemas to the API (PostgREST).
-- ════════════════════════════════════════════════════════════════════════
-- Without this, every supabase.schema('platform'|'members') call returns
-- PGRST106 "Invalid schema", so provisioning (provision_user), social features,
-- and all member-node data fail. This is the SQL equivalent of
-- Dashboard > Settings > API > "Exposed schemas".
--
-- ⚠️ ALSO add `platform` and `members` in that dashboard setting. The dashboard
-- value is the durable source of truth; a control-plane config sync can
-- otherwise revert the role GUC set below.
-- ════════════════════════════════════════════════════════════════════════

grant usage on schema platform to anon, authenticated, service_role;
grant usage on schema members  to anon, authenticated, service_role;

-- Keep the existing exposed schemas (public, graphql_public) and add ours.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, platform, members';

-- Tell the running PostgREST to reload its config + schema cache now.
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
