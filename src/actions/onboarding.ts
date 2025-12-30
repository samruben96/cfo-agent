'use server'

import { createClient } from '@/lib/supabase/server'

import type { ActionResponse } from '@/types'

// Field names that map to profile columns
const ONBOARDING_FIELD_MAP: Record<string, string> = {
  agency_name: 'agency_name',
  annual_revenue_range: 'annual_revenue_range',
  employee_count: 'employee_count',
  user_role: 'user_role',
  biggest_question: 'top_financial_question',
  monthly_overhead: 'monthly_overhead_estimate'
}

/**
 * Saves a single onboarding answer and updates the step number.
 * Called after each question is answered.
 */
export async function saveOnboardingStep(
  field: string,
  value: string | number | null,
  step: number
): Promise<ActionResponse<{ step: number }>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Onboarding]', { action: 'saveStep', error: 'Not authenticated' })
      return { data: null, error: 'Not authenticated' }
    }

    // Map field name to database column
    const dbColumn = ONBOARDING_FIELD_MAP[field] || field

    const { error } = await supabase
      .from('profiles')
      .update({
        [dbColumn]: value,
        onboarding_step: step
      })
      .eq('id', user.id)

    if (error) {
      console.error('[Onboarding]', { action: 'saveStep', error: error.message, code: error.code })

      // If onboarding_step column doesn't exist, try without it
      if (error.message?.includes('onboarding_step') || error.code === '42703') {
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update({ [dbColumn]: value })
          .eq('id', user.id)

        if (fallbackError) {
          console.error('[Onboarding]', { action: 'saveStep-fallback', error: fallbackError.message })
          return { data: null, error: 'Failed to save progress' }
        }

        return { data: { step }, error: null }
      }

      return { data: null, error: 'Failed to save progress' }
    }

    return { data: { step }, error: null }
  } catch (e) {
    console.error('[Onboarding]', {
      action: 'saveStep',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to save progress' }
  }
}

/**
 * Marks the user's profile as onboarding complete.
 * Called after the last question is answered.
 */
export async function completeOnboarding(): Promise<ActionResponse<{ redirectTo: string }>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Onboarding]', { action: 'complete', error: 'Not authenticated' })
      return { data: null, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_complete: true
      })
      .eq('id', user.id)

    if (error) {
      console.error('[Onboarding]', { action: 'complete', error: error.message })
      return { data: null, error: 'Failed to complete onboarding' }
    }

    return { data: { redirectTo: '/chat' }, error: null }
  } catch (e) {
    console.error('[Onboarding]', {
      action: 'complete',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to complete onboarding' }
  }
}

/**
 * Fetches the current onboarding progress for resuming.
 * Returns the current step and all saved answers.
 */
export async function getOnboardingProgress(): Promise<ActionResponse<{
  currentStep: number
  answers: Record<string, string | number | null>
  isComplete: boolean
}>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Onboarding]', { action: 'getProgress', error: 'Not authenticated' })
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('agency_name, annual_revenue_range, employee_count, user_role, top_financial_question, monthly_overhead_estimate, onboarding_complete, onboarding_step')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Onboarding]', { action: 'getProgress', error: error.message, code: error.code, details: error.details })

      // If onboarding_step column doesn't exist, try without it
      if (error.message?.includes('onboarding_step') || error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('agency_name, annual_revenue_range, employee_count, user_role, top_financial_question, monthly_overhead_estimate, onboarding_complete')
          .eq('id', user.id)
          .single()

        if (fallbackError) {
          console.error('[Onboarding]', { action: 'getProgress-fallback', error: fallbackError.message })
          return { data: null, error: 'Failed to fetch progress' }
        }

        return {
          data: {
            currentStep: 0,
            answers: {
              agency_name: fallbackData.agency_name,
              annual_revenue_range: fallbackData.annual_revenue_range,
              employee_count: fallbackData.employee_count,
              user_role: fallbackData.user_role,
              biggest_question: fallbackData.top_financial_question,
              monthly_overhead: fallbackData.monthly_overhead_estimate
            },
            isComplete: fallbackData.onboarding_complete || false
          },
          error: null
        }
      }

      return { data: null, error: 'Failed to fetch progress' }
    }

    return {
      data: {
        currentStep: data.onboarding_step || 0,
        answers: {
          agency_name: data.agency_name,
          annual_revenue_range: data.annual_revenue_range,
          employee_count: data.employee_count,
          user_role: data.user_role,
          biggest_question: data.top_financial_question,
          monthly_overhead: data.monthly_overhead_estimate
        },
        isComplete: data.onboarding_complete || false
      },
      error: null
    }
  } catch (e) {
    console.error('[Onboarding]', {
      action: 'getProgress',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to fetch progress' }
  }
}
