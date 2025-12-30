-- Migration: Create employees table with RLS
-- Story: 3.2 Employee/Headcount Intake Form
-- Created: 2025-12-30

-- ===========================================
-- EMPLOYEES TABLE
-- ===========================================
-- Stores individual employee data for per-employee and per-role cost calculations
-- Links to auth.users via user_id for multi-tenant support

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Employee identification
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100), -- Optional internal ID (e.g., "EMP001")

  -- Role and department
  role VARCHAR(255) NOT NULL, -- e.g., "Producer", "CSR", "Admin"
  department VARCHAR(255), -- e.g., "Sales", "Service", "Operations"

  -- Employment type
  employment_type VARCHAR(50) DEFAULT 'full-time' NOT NULL, -- full-time, part-time, contractor

  -- Compensation (annual figures)
  annual_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  annual_benefits DECIMAL(12,2) DEFAULT 0, -- Health, 401k match, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE public.employees IS 'Employee records for per-employee cost calculations and payroll analysis';

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
-- Using (select auth.uid()) pattern for optimizer caching
-- Separate policies for each operation per project-context.md best practices

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own employees
CREATE POLICY "Users can view own employees"
ON public.employees FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- INSERT: Users can only insert their own employees
CREATE POLICY "Users can insert own employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own employees
CREATE POLICY "Users can update own employees"
ON public.employees FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own employees
CREATE POLICY "Users can delete own employees"
ON public.employees FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================
-- Uses existing function from 00001 migration

CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- INDEX
-- ===========================================
-- Index for faster lookups by user

CREATE INDEX idx_employees_user_id ON public.employees(user_id);
