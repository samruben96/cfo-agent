import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

// Revenue range midpoints for insight calculation
const REVENUE_MIDPOINTS: Record<string, number> = {
  'Under $500K': 250000,
  '$500K-$1M': 750000,
  '$1M-$2M': 1500000,
  '$2M-$5M': 3500000,
  'Over $5M': 7500000
}

// Industry benchmarks for revenue per employee (creative/advertising agencies)
const BENCHMARK_RANGES: Record<string, { min: number; max: number }> = {
  'Under $500K': { min: 80000, max: 120000 },
  '$500K-$1M': { min: 100000, max: 150000 },
  '$1M-$2M': { min: 120000, max: 175000 },
  '$2M-$5M': { min: 150000, max: 200000 },
  'Over $5M': { min: 175000, max: 250000 }
}

function generateFirstInsight(
  agencyName: string | null,
  employeeCount: number | null,
  revenueRange: string | null
): string {
  if (!employeeCount || !revenueRange) {
    return `Welcome${agencyName ? `, ${agencyName}` : ''}! I'm ready to help you understand your agency's finances. Ask me anything about your costs, profitability, or financial planning.`
  }

  const revenueMidpoint = REVENUE_MIDPOINTS[revenueRange] || 1000000
  const revenuePerEmployee = Math.round(revenueMidpoint / employeeCount)
  const benchmark = BENCHMARK_RANGES[revenueRange] || { min: 100000, max: 150000 }

  const formattedRPE = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(revenuePerEmployee)

  const formattedBenchmarkMin = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(benchmark.min)

  const formattedBenchmarkMax = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(benchmark.max)

  let performanceNote = ''
  if (revenuePerEmployee < benchmark.min) {
    performanceNote = "This is below the typical range, which might indicate opportunities to optimize staffing or increase revenue."
  } else if (revenuePerEmployee > benchmark.max) {
    performanceNote = "This is above the typical range - great work! This could mean you're running lean or have strong pricing."
  } else {
    performanceNote = "This is within the healthy range for agencies your size."
  }

  return `With ${employeeCount} employees and ${revenueRange} in annual revenue, your estimated revenue per employee is approximately ${formattedRPE}. Industry benchmarks for agencies your size suggest ${formattedBenchmarkMin}-${formattedBenchmarkMax}. ${performanceNote}`
}

async function ChatContent() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile for personalization
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_name, employee_count, annual_revenue_range, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Redirect to onboarding if not complete
  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  const firstInsight = generateFirstInsight(
    profile.agency_name,
    profile.employee_count,
    profile.annual_revenue_range
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(height.header))]">
      <div className="w-full max-w-chat px-md">
        {/* Welcome message with first insight */}
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <h1 className="text-h1 text-primary mb-md">
            Welcome{profile.agency_name ? `, ${profile.agency_name}` : ''}!
          </h1>
          <p className="text-body text-muted-foreground max-w-md mb-lg">
            I&apos;m your AI-powered CFO assistant. Let&apos;s start with your first insight:
          </p>

          <Card className="max-w-lg">
            <CardContent className="pt-6">
              <p className="text-body text-foreground leading-relaxed">
                {firstInsight}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example questions */}
        <div className="mt-lg mb-xl">
          <p className="text-sm text-muted-foreground text-center mb-md">
            Try asking:
          </p>
          <div className="flex flex-wrap justify-center gap-sm">
            {[
              'What are my biggest expenses?',
              'How much can I afford to hire?',
              'What is my EBITDA?'
            ].map((question) => (
              <span
                key={question}
                className="px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded-full"
              >
                {question}
              </span>
            ))}
          </div>
        </div>

        {/* Chat input placeholder */}
        <div className="mt-xl">
          <div className="flex items-center gap-sm p-md bg-surface border border-border rounded-lg">
            <input
              type="text"
              placeholder="Ask about your finances..."
              className="flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
              disabled
            />
            <span className="text-caption text-muted-foreground">
              (Coming in Story 2.3)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
