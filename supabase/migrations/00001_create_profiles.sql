-- Migration: Create profiles table with RLS
-- Story: 1.2 Database Schema & RLS Foundation
-- Created: 2025-12-29

-- ===========================================
-- PROFILES TABLE
-- ===========================================
-- Core user profile table linked to auth.users
-- Contains agency onboarding fields from FR4, FR5

CREATE TABLE public.profiles (
  -- Primary key linked to auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,

  -- Agency onboarding fields (FR4, FR5)
  agency_name TEXT,
  annual_revenue_range TEXT, -- dropdown value
  employee_count INTEGER,
  user_role TEXT, -- 'owner' | 'office_manager' | 'other'
  top_financial_question TEXT,
  monthly_overhead_estimate DECIMAL(12,2),

  -- Status flags
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users, contains agency onboarding data';

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
-- Using (select auth.uid()) pattern for optimizer caching
-- Separate policies for each operation per best practices

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- INSERT: Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- DELETE: Users can only delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING ((select auth.uid()) = id);

-- ===========================================
-- AUTO-PROFILE CREATION TRIGGER
-- ===========================================
-- Automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search_path for security
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================
-- Automatically updates updated_at timestamp on row changes

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
