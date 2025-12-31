-- Migration: Create storage bucket for documents
-- Story: 3.3 CSV File Upload, 3.4 PDF Document Upload
-- Created: 2025-12-30

-- ===========================================
-- DOCUMENTS STORAGE BUCKET
-- ===========================================
-- Private bucket for user document uploads (CSV, PDF)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- STORAGE POLICIES
-- ===========================================
-- Users can only access their own files (files stored in user_id/ prefix)

-- SELECT: Users can view their own files
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own files
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);
