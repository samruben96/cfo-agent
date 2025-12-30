-- Migration: Add financial tracking fields to profiles
-- Story: 2.6 Conversational Data Input
-- Created: 2025-12-29

-- ===========================================
-- ADD FINANCIAL TRACKING FIELDS
-- ===========================================
-- These fields support conversational data input where users
-- can update financial information through chat

-- Monthly rent amount (separate from total overhead)
ALTER TABLE public.profiles
ADD COLUMN monthly_rent DECIMAL(12,2);

COMMENT ON COLUMN public.profiles.monthly_rent IS 'Monthly rent/lease cost';

-- Monthly software/SaaS spend
ALTER TABLE public.profiles
ADD COLUMN monthly_software_spend DECIMAL(12,2);

COMMENT ON COLUMN public.profiles.monthly_software_spend IS 'Monthly software/SaaS subscription costs';
