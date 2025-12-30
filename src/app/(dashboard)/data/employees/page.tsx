import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { EmployeeList } from '@/components/data-input/EmployeeList'
import { BackToChatLink } from '@/components/shared'
import { getEmployees } from '@/actions/employees'
import { createClient } from '@/lib/supabase/server'

async function EmployeesContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employees, error } = await getEmployees()

  if (error) {
    // Log error but don't fail - show empty list
    console.error('[EmployeesPage]', { error })
  }

  return <EmployeeList initialEmployees={employees ?? []} />
}

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted rounded-xl" />
      <div className="h-24 bg-muted rounded-xl" />
      <div className="h-24 bg-muted rounded-xl" />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    // h-full fills the fixed main area, overflow-y-auto enables scrolling
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-md py-xl">
        {/* Back to Chat link - respects unsaved changes dialog */}
        <BackToChatLink />

        <div className="flex flex-col items-center text-center mb-xl">
          <h1 className="text-h1 text-primary mb-md">Employee Information</h1>
          <p className="text-body text-muted-foreground max-w-md">
            Add your team members to calculate per-employee and per-role costs.
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <EmployeesContent />
        </Suspense>
      </div>
    </div>
  )
}
