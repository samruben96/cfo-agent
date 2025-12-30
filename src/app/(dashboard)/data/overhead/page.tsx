import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { OverheadCostForm } from '@/components/data-input/OverheadCostForm'
import { BackToChatLink } from '@/components/shared'
import { getOverheadCosts } from '@/actions/overhead-costs'
import { createClient } from '@/lib/supabase/server'

async function OverheadCostsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: overheadCosts, error } = await getOverheadCosts()

  if (error) {
    // Log error but don't fail - show empty form
    console.error('[OverheadCostsPage]', { error })
  }

  return <OverheadCostForm initialData={overheadCosts} />
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-32 bg-muted rounded-xl" />
    </div>
  )
}

export default function OverheadCostsPage() {
  return (
    // h-full fills the fixed main area, overflow-y-auto enables scrolling
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-md py-xl">
        {/* Back to Chat link - respects unsaved changes dialog */}
        <BackToChatLink />

        <div className="flex flex-col items-center text-center mb-xl">
          <h1 className="text-h1 text-primary mb-md">Overhead Costs</h1>
          <p className="text-body text-muted-foreground max-w-md">
            Enter your monthly operating expenses to help calculate true employee
            costs.
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <OverheadCostsContent />
        </Suspense>
      </div>
    </div>
  )
}
