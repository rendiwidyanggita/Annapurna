-- ==============================================================================
-- ANNAPURNA Adventure — Security & Constraints for Sprint 1 Remaining Tables
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Partial Unique Index: Only one is_primary = true per package
CREATE UNIQUE INDEX IF NOT EXISTS package_media_one_primary_per_package
ON package_media (package_id)
WHERE is_primary = true;

-- 2. Enable Row Level Security (RLS) on newly added tables
ALTER TABLE unit_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_media ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy for package_media (customer catalog view)
DROP POLICY IF EXISTS "Public Read Package Media" ON package_media;
CREATE POLICY "Public Read Package Media" ON package_media
FOR SELECT USING (true);

-- 4. Admin/Owner access for unit_status_logs (audit trail)
DROP POLICY IF EXISTS "Admin Full Access Unit Status Logs" ON unit_status_logs;
CREATE POLICY "Admin Full Access Unit Status Logs" ON unit_status_logs
FOR ALL USING (
  auth.role() = 'service_role'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
);

-- 5. Admin/Owner management for package_media
DROP POLICY IF EXISTS "Admin Full Access Package Media" ON package_media;
CREATE POLICY "Admin Full Access Package Media" ON package_media
FOR ALL USING (
  auth.role() = 'service_role'
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
);
