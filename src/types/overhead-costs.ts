/**
 * TypeScript types for overhead costs feature.
 * Story: 3-1-overhead-cost-intake-form
 */

/**
 * Individual software/SaaS cost item.
 */
export interface SoftwareCost {
  /** Client-side UUID for React key */
  id: string;
  /** Software name (e.g., "Slack", "QuickBooks") */
  name: string;
  /** Monthly cost in dollars */
  monthlyCost: number;
}

/**
 * Application-level overhead costs model (camelCase).
 */
export interface OverheadCosts {
  id: string;
  userId: string;
  monthlyRent: number;
  monthlyUtilities: number;
  monthlyInsurance: number;
  otherMonthlyCosts: number;
  softwareCosts: SoftwareCost[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data shape for overhead costs form.
 * Uses null for empty fields to distinguish from zero.
 */
export interface OverheadCostsFormData {
  monthlyRent: number | null;
  monthlyUtilities: number | null;
  monthlyInsurance: number | null;
  otherMonthlyCosts: number | null;
  softwareCosts: SoftwareCost[];
}

/**
 * Database row type (snake_case) matching Supabase schema.
 */
export interface OverheadCostsRow {
  id: string;
  user_id: string;
  monthly_rent: number | null;
  monthly_utilities: number | null;
  monthly_insurance: number | null;
  other_monthly_costs: number | null;
  software_costs: Array<{ name: string; monthly_cost: number }> | null;
  created_at: string;
  updated_at: string;
}
