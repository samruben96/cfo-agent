// 1. React/Next imports
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

// 3. Internal aliases (@/)
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/actions/onboarding'
import { OnboardingContainer } from '@/components/onboarding'

async function OnboardingContent() {
  // Ensure user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get onboarding progress for resume functionality
  const progressResult = await getOnboardingProgress()

  // If onboarding is already complete, redirect to chat
  if (progressResult.data?.isComplete) {
    redirect('/chat')
  }

  const initialStep = progressResult.data?.currentStep || 0
  const initialAnswers = progressResult.data?.answers || {}

  return (
    <OnboardingContainer
      initialStep={initialStep}
      initialAnswers={initialAnswers}
    />
  )
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading...</div>
        }
      >
        <OnboardingContent />
      </Suspense>
    </div>
  )
}
