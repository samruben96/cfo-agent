-- Migration: Create documents table for file uploads
-- Story: 3.3 CSV File Upload
-- Created: 2025-12-30

-- ===========================================
-- DOCUMENTS TABLE
-- ===========================================
-- Stores metadata for uploaded files (CSV, PDF)
-- Extracted data stored in JSONB for flexibility

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- File metadata
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'csv', 'pdf' (future)
  file_size INTEGER NOT NULL, -- in bytes
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path

  -- Processing status
  processing_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    -- pending, processing, completed, error
  csv_type VARCHAR(50), -- 'pl', 'payroll', 'employees', 'unknown'

  -- Extracted data (JSONB for flexibility)
  extracted_data JSONB,
  row_count INTEGER,
  column_mappings JSONB, -- User-confirmed mappings

  -- Error handling
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Add comment for documentation
COMMENT ON TABLE public.documents IS 'Uploaded document metadata with extracted data for CSV/PDF processing';

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
-- Using (select auth.uid()) pattern for optimizer caching
-- Separate policies for each operation per best practices

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- INSERT: Users can only insert their own documents
CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own documents
CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own documents
CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================
-- Uses existing update_updated_at_column() function from 00001 migration

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- INDEXES
-- ===========================================
-- Fast lookups by user and processing status

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_processing_status ON public.documents(processing_status);
