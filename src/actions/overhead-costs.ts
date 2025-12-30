'use server'

import { createClient } from '@/lib/supabase/server'

import type { ActionResponse } from '@/types'
import type {
  OverheadCosts,
  OverheadCostsFormData,
  OverheadCostsRow,
  SoftwareCost,
} from '@/types/overhead-costs'

/**
 * Transforms a database row to the application-level OverheadCosts model.
 */
function transformRowToOverheadCosts(row: OverheadCostsRow): OverheadCosts {
  return {
    id: row.id,
    userId: row.user_id,
    monthlyRent: row.monthly_rent ?? 0,
    monthlyUtilities: row.monthly_utilities ?? 0,
    monthlyInsurance: row.monthly_insurance ?? 0,
    otherMonthlyCosts: row.other_monthly_costs ?? 0,
    softwareCosts: (row.software_costs ?? []).map(
      (sc, idx): SoftwareCost => ({
        id: `software-${idx}-${row.id}`,
        name: sc.name,
        monthlyCost: sc.monthly_cost,
      })
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Fetches the current user's overhead costs.
 * Returns null (not an error) if no overhead costs exist yet.
 */
export async function getOverheadCosts(): Promise<
  ActionResponse<OverheadCosts | null>
> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[OverheadCostsService]', {
        action: 'getOverheadCosts',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('overhead_costs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // PGRST116 = no rows found - this is not an error for this use case
    if (error && error.code !== 'PGRST116') {
      console.error('[OverheadCostsService]', {
        action: 'getOverheadCosts',
        error: error.message,
      })
      return { data: null, error: 'Failed to load overhead costs' }
    }

    if (!data) {
      // No data yet - not an error, just return null
      return { data: null, error: null }
    }

    const transformed = transformRowToOverheadCosts(data as OverheadCostsRow)
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[OverheadCostsService]', {
      action: 'getOverheadCosts',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to load overhead costs' }
  }
}

/**
 * Saves (creates or updates) the user's overhead costs.
 * Uses upsert pattern since each user has one record.
 */
export async function saveOverheadCosts(
  formData: OverheadCostsFormData
): Promise<ActionResponse<OverheadCosts>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[OverheadCostsService]', {
        action: 'saveOverheadCosts',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    // Transform from camelCase TS to snake_case DB
    const dbData = {
      user_id: user.id,
      monthly_rent: formData.monthlyRent ?? 0,
      monthly_utilities: formData.monthlyUtilities ?? 0,
      monthly_insurance: formData.monthlyInsurance ?? 0,
      other_monthly_costs: formData.otherMonthlyCosts ?? 0,
      software_costs: formData.softwareCosts
        .filter((sc) => sc.name.trim() !== '')
        .map((sc) => ({
          name: sc.name.trim(),
          monthly_cost: sc.monthlyCost,
        })),
    }

    // Upsert pattern - insert or update based on user_id unique constraint
    const { data, error } = await supabase
      .from('overhead_costs')
      .upsert(dbData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[OverheadCostsService]', {
        action: 'saveOverheadCosts',
        error: error.message,
      })
      return { data: null, error: 'Failed to save overhead costs' }
    }

    const transformed = transformRowToOverheadCosts(data as OverheadCostsRow)
    console.log('[OverheadCostsService]', {
      action: 'saveOverheadCosts',
      userId: user.id,
      success: true,
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[OverheadCostsService]', {
      action: 'saveOverheadCosts',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to save overhead costs' }
  }
}
