-- ==============================================================================
-- ANNAPURNA Adventure — Storage Security Policies for 'products' Bucket
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure 'products' bucket exists and is marked public for catalog delivery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  26214400, -- 25 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm'];

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies on 'products' bucket if re-running
DROP POLICY IF EXISTS "Public Read Access for Product Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin and Owner Can Upload Product Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin and Owner Can Update Product Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin and Owner Can Delete Product Media" ON storage.objects;

-- 3. Read Policy (Public SELECT): Allow anyone to view product images/videos in catalog
CREATE POLICY "Public Read Access for Product Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 4. Insert Policy: Only Admin, Owner, or Server Actions with service_role can upload
CREATE POLICY "Admin and Owner Can Upload Product Media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
  )
);

-- 5. Update Policy: Only Admin, Owner, or Server Actions with service_role can modify
CREATE POLICY "Admin and Owner Can Update Product Media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
  )
);

-- 6. Delete Policy: Only Admin, Owner, or Server Actions with service_role can delete
CREATE POLICY "Admin and Owner Can Delete Product Media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner', 'ADMIN', 'OWNER')
  )
);
