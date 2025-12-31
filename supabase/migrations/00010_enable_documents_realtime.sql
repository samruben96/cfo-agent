-- Migration: Enable Realtime for documents table
-- Story: 3.5 Document Processing Status & Notifications
-- Created: 2025-12-30

-- ===========================================
-- ENABLE REALTIME PUBLICATION
-- ===========================================
-- Add documents table to the supabase_realtime publication
-- This allows clients to subscribe to changes on this table
-- RLS policies still apply - users only receive updates for their own documents

ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Add comment for documentation
COMMENT ON TABLE public.documents IS 'Uploaded document metadata with extracted data for CSV/PDF processing. Realtime enabled for status updates.';
