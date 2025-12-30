'use server'

import { createClient } from '@/lib/supabase/server'

import type { ActionResponse } from '@/types'

export interface ProfileData {
  agencyName: string | null
  annualRevenueRange: string | null
  employeeCount: number | null
  userRole: string | null
  topFinancialQuestion: string | null
  monthlyOverheadEstimate: number | null
}

/**
 * Fetches the current user's profile data.
 */
export async function getProfile(): Promise<ActionResponse<ProfileData>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Profile]', { action: 'getProfile', error: 'Not authenticated' })
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('agency_name, annual_revenue_range, employee_count, user_role, top_financial_question, monthly_overhead_estimate')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Profile]', { action: 'getProfile', error: error.message })
      return { data: null, error: 'Failed to fetch profile' }
    }

    return {
      data: {
        agencyName: data.agency_name,
        annualRevenueRange: data.annual_revenue_range,
        employeeCount: data.employee_count,
        userRole: data.user_role,
        topFinancialQuestion: data.top_financial_question,
        monthlyOverheadEstimate: data.monthly_overhead_estimate
      },
      error: null
    }
  } catch (e) {
    console.error('[Profile]', {
      action: 'getProfile',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to fetch profile' }
  }
}

/**
 * Updates the user's profile with new data.
 */
export async function updateProfile(
  data: ProfileData
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Profile]', { action: 'updateProfile', error: 'Not authenticated' })
      return { data: null, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        agency_name: data.agencyName,
        annual_revenue_range: data.annualRevenueRange,
        employee_count: data.employeeCount,
        user_role: data.userRole,
        top_financial_question: data.topFinancialQuestion,
        monthly_overhead_estimate: data.monthlyOverheadEstimate
      })
      .eq('id', user.id)

    if (error) {
      console.error('[Profile]', { action: 'updateProfile', error: error.message })
      return { data: null, error: 'Failed to update profile' }
    }

    return { data: { success: true }, error: null }
  } catch (e) {
    console.error('[Profile]', {
      action: 'updateProfile',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to update profile' }
  }
}
