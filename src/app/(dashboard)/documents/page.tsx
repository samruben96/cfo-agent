import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BackToChatLink } from '@/components/shared'
import { DocumentsClient } from '@/components/documents/DocumentsClient'
import { getDocuments } from '@/actions/documents'
import { createClient } from '@/lib/supabase/server'

async function DocumentsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: documents, error } = await getDocuments()

  if (error) {
    console.error('[DocumentsPage]', { error })
  }

  return <DocumentsClient initialDocuments={documents ?? []} />
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-32 bg-muted rounded-xl" />
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-md py-xl">
        <BackToChatLink />

        <div className="flex flex-col items-center text-center mb-xl">
          <h1 className="text-h1 text-primary mb-md">Documents</h1>
          <p className="text-body text-muted-foreground max-w-md">
            Upload CSV or PDF files to import your financial data. Supported formats:
            P&L statements, Payroll reports, Employee rosters.
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <DocumentsContent />
        </Suspense>
      </div>
    </div>
  )
}
