-- Migration: Add NOT NULL constraints to profiles table
-- Story: 1.2 Code Review Fix
-- Created: 2025-12-29

-- Update existing NULL values to defaults before adding constraints
UPDATE public.profiles
SET onboarding_complete = FALSE
WHERE onboarding_complete IS NULL;

UPDATE public.profiles
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE public.profiles
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Add NOT NULL constraints
ALTER TABLE public.profiles
  ALTER COLUMN onboarding_complete SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;
