-- Migration: Add onboarding_step column to profiles table
-- Story: 2.1 Onboarding Flow
-- Created: 2025-12-29

-- Add onboarding_step column to track user progress through onboarding
ALTER TABLE public.profiles
ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Current step in the onboarding flow (0-6)';
