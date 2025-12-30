'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onQuestionClick: (question: string) => void
  className?: string
}

const EXAMPLE_QUESTIONS = [
  'What does each employee cost me?',
  'What is my payroll ratio?',
  'Can I afford to hire someone new?'
]

export function EmptyState({ onQuestionClick, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[60vh] py-2xl', className)}>
      <h2 className="text-h2 text-primary mb-md">
        Welcome to your CFO Bot
      </h2>
      <p className="text-body text-muted-foreground mb-lg max-w-md text-center">
        Ask me anything about your agency&apos;s finances. I&apos;m here to help you understand your numbers and make better decisions.
      </p>
      <div className="flex flex-col gap-sm w-full max-w-md">
        <p className="text-body-sm text-muted-foreground text-center mb-xs">
          Try asking:
        </p>
        {EXAMPLE_QUESTIONS.map((question) => (
          <Button
            key={question}
            variant="outline"
            className="w-full text-left justify-start"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}
