import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Profile update result shape
 * Tools return this instead of throwing errors
 */
export interface ProfileToolResult {
  success: boolean
  message: string
}

// Zod schemas for tool inputs
// Using .nonnegative() to allow zero values (e.g., "I don't have any software costs")
const rentSchema = z.object({
  amount: z.number().nonnegative().describe('Monthly rent amount in dollars'),
})

const employeeCountSchema = z.object({
  count: z.number().int().positive().describe('Number of employees'),
})

const overheadSchema = z.object({
  amount: z.number().nonnegative().describe('Total monthly overhead amount in dollars'),
})

const softwareSpendSchema = z.object({
  amount: z.number().nonnegative().describe('Monthly software/SaaS spend in dollars'),
})

/**
 * Creates profile update tools for the AI to use during conversations.
 * Each tool allows the AI to update specific financial data in the user's profile.
 *
 * @param supabase - Server-side Supabase client with user context
 * @param userId - The authenticated user's ID
 * @returns Object containing all profile update tools
 */
export function createProfileTools(supabase: SupabaseClient, userId: string) {
  return {
    updateRent: tool({
      description: 'Update the monthly rent cost when the user mentions their rent amount. Use this when the user says something like "My rent is $3,500" or "I pay $4000 in rent" or "Our lease is $2,500 per month".',
      inputSchema: zodSchema(rentSchema),
      execute: async ({ amount }): Promise<ProfileToolResult> => {
        const { error } = await supabase
          .from('profiles')
          .update({ monthly_rent: amount })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateRent', error: error.message, userId })
          return { success: false, message: 'Failed to update rent' }
        }

        console.log('[ProfileTools]', { action: 'updateRent', amount, userId })
        return {
          success: true,
          message: `Got it, I've updated your monthly rent to $${amount.toLocaleString('en-US')}`,
        }
      },
    }),

    updateEmployeeCount: tool({
      description: 'Update the employee headcount when the user mentions how many employees they have. Use this when the user says something like "I have 8 employees" or "We have 12 people" or "Our team is 5 people".',
      inputSchema: zodSchema(employeeCountSchema),
      execute: async ({ count }): Promise<ProfileToolResult> => {
        const { error } = await supabase
          .from('profiles')
          .update({ employee_count: count })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateEmployeeCount', error: error.message, userId })
          return { success: false, message: 'Failed to update employee count' }
        }

        console.log('[ProfileTools]', { action: 'updateEmployeeCount', count, userId })
        return {
          success: true,
          message: `Got it, I've updated your employee count to ${count}`,
        }
      },
    }),

    updateMonthlyOverhead: tool({
      description: 'Update the total monthly overhead estimate when the user mentions their total overhead costs. Use this when the user says something like "My monthly overhead is $15,000" or "Total overhead runs about $20k".',
      inputSchema: zodSchema(overheadSchema),
      execute: async ({ amount }): Promise<ProfileToolResult> => {
        const { error } = await supabase
          .from('profiles')
          .update({ monthly_overhead_estimate: amount })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateMonthlyOverhead', error: error.message, userId })
          return { success: false, message: 'Failed to update overhead estimate' }
        }

        console.log('[ProfileTools]', { action: 'updateMonthlyOverhead', amount, userId })
        return {
          success: true,
          message: `Got it, I've updated your monthly overhead estimate to $${amount.toLocaleString('en-US')}`,
        }
      },
    }),

    updateSoftwareSpend: tool({
      description: 'Update the monthly software/SaaS spend when the user mentions their software costs. Use this when the user says something like "We spend $2,000 on software" or "SaaS costs are about $1,500/month" or "Our software subscriptions run $3k".',
      inputSchema: zodSchema(softwareSpendSchema),
      execute: async ({ amount }): Promise<ProfileToolResult> => {
        const { error } = await supabase
          .from('profiles')
          .update({ monthly_software_spend: amount })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateSoftwareSpend', error: error.message, userId })
          return { success: false, message: 'Failed to update software spend' }
        }

        console.log('[ProfileTools]', { action: 'updateSoftwareSpend', amount, userId })
        return {
          success: true,
          message: `Got it, I've updated your monthly software spend to $${amount.toLocaleString('en-US')}`,
        }
      },
    }),
  }
}

// Export schemas for testing
export { rentSchema, employeeCountSchema, overheadSchema, softwareSpendSchema }

/**
 * Type helper for the tools object returned by createProfileTools
 */
export type ProfileTools = ReturnType<typeof createProfileTools>
