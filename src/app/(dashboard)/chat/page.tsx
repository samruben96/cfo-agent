import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getMostRecentConversation } from '@/lib/conversations'
import { createClient } from '@/lib/supabase/server'

import { ChatClient } from './ChatClient'

interface ChatContentProps {
  searchParams: Promise<{ documentId?: string; error?: string }>
}

async function ChatContent({ searchParams }: ChatContentProps) {
  // Await searchParams inside Suspense boundary to avoid blocking the page
  const params = await searchParams
  const documentId = params.documentId
  const isErrorResolution = params.error === 'true'

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
  // Skip loading conversation if documentId provided - we want a fresh chat about the document
  const { data: recentConversation } = documentId
    ? { data: null }
    : await getMostRecentConversation(user.id)

  // Profile data (agency_name, employee_count, annual_revenue_range) is fetched
  // server-side in /api/chat for security - prevents client manipulation
  return (
    <ChatClient
      initialConversationId={recentConversation?.id}
      initialDocumentId={documentId}
      isErrorResolution={isErrorResolution}
    />
  )
}

interface PageProps {
  searchParams: Promise<{ documentId?: string; error?: string }>
}

export default async function ChatPage({ searchParams }: PageProps) {
  return (
    <div className="h-full">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
        <ChatContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
