import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getProfile } from '@/actions/profile'
import { AgencyProfileForm, BackToChatLink } from '@/components/settings'

async function SettingsContent() {
  const { data: profile, error } = await getProfile()

  if (error === 'Not authenticated') {
    redirect('/auth/login')
  }

  return (
    <>
      {error ? (
        <div className="p-lg bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <p className="text-destructive">{error}</p>
        </div>
      ) : profile ? (
        <AgencyProfileForm initialData={profile} />
      ) : null}
    </>
  )
}

export default function SettingsPage() {
  return (
    // h-full fills the fixed main area, overflow-y-auto enables scrolling
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-md py-xl">
        {/* Back to Chat link */}
        <BackToChatLink />

        <div className="flex flex-col items-center text-center mb-xl">
          <h1 className="text-h1 text-primary mb-md">Settings</h1>
          <p className="text-body text-muted-foreground max-w-md">
            Manage your agency profile and account preferences.
          </p>
        </div>

        <Suspense fallback={<div className="text-muted-foreground text-center">Loading profile...</div>}>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  )
}
