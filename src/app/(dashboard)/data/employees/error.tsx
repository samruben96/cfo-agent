'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function EmployeesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[EmployeesPage] Error:', error)
  }, [error])

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-md py-xl">
        <Card className="py-8">
          <CardContent className="flex flex-col items-center text-center">
            <h2 className="text-h2 text-destructive mb-md">
              Something went wrong
            </h2>
            <p className="text-body text-muted-foreground mb-lg max-w-md">
              We encountered an error loading the employees page. Please try
              again.
            </p>
            <Button onClick={reset}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
