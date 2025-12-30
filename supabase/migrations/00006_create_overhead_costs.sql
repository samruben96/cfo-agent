-- Migration: 00006_create_overhead_costs
-- Description: Create overhead_costs table for storing monthly operating expenses
-- Story: 3-1-overhead-cost-intake-form

-- ============================================================================
-- OVERHEAD_COSTS TABLE
-- ============================================================================
-- Stores monthly operating expenses per user for CFO cost calculations

CREATE TABLE overhead_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Fixed monthly costs
  monthly_rent DECIMAL(10,2) DEFAULT 0,
  monthly_utilities DECIMAL(10,2) DEFAULT 0,
  monthly_insurance DECIMAL(10,2) DEFAULT 0,
  other_monthly_costs DECIMAL(10,2) DEFAULT 0,

  -- Itemized software costs stored as JSONB array
  -- Format: [{ "name": "Slack", "monthly_cost": 25.00 }, ...]
  software_costs JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One record per user (upsert pattern)
  UNIQUE(user_id)
);

-- Add comment for documentation
COMMENT ON TABLE overhead_costs IS 'Monthly overhead costs per user for CFO calculations';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Using (select auth.uid()) pattern for optimizer caching
-- Separate policies for each operation per best practices

ALTER TABLE overhead_costs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own overhead costs
CREATE POLICY "Users can view own overhead costs"
  ON overhead_costs FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- INSERT: Users can only insert their own overhead costs
CREATE POLICY "Users can insert own overhead costs"
  ON overhead_costs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own overhead costs
CREATE POLICY "Users can update own overhead costs"
  ON overhead_costs FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own overhead costs
CREATE POLICY "Users can delete own overhead costs"
  ON overhead_costs FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Reuse the update_updated_at_column function from 00001_create_profiles.sql

CREATE TRIGGER set_overhead_costs_updated_at
  BEFORE UPDATE ON overhead_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Index for faster user lookups

CREATE INDEX idx_overhead_costs_user_id ON overhead_costs(user_id);
