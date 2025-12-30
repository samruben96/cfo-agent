import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getMostRecentConversation } from '@/lib/conversations'
import { createClient } from '@/lib/supabase/server'

import { ChatClient } from './ChatClient'

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

  // Load most recent conversation for this user (AC #2)
  const { data: recentConversation } = await getMostRecentConversation(user.id)

  // Profile data (agency_name, employee_count, annual_revenue_range) is fetched
  // server-side in /api/chat for security - prevents client manipulation
  return <ChatClient initialConversationId={recentConversation?.id} />
}

export default function ChatPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
        <ChatContent />
      </Suspense>
    </div>
  )
}
