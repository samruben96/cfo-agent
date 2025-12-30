'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SuggestedQuestionsProps {
  questions: string[]
  onClick: (question: string) => void
  className?: string
}

export function SuggestedQuestions({
  questions,
  onClick,
  className
}: SuggestedQuestionsProps) {
  // Return null if no questions to display
  if (questions.length === 0) {
    return null
  }

  // Limit to 3 suggestions maximum
  const displayQuestions = questions.slice(0, 3)

  return (
    <div
      data-testid="suggested-questions"
      className={cn(
        'flex flex-wrap gap-2 mt-2',
        className
      )}
    >
      {displayQuestions.map((question) => (
        <Button
          key={question}
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground hover:text-foreground hover:bg-[#d4a574]/10 transition-colors"
          onClick={() => onClick(question)}
          aria-label={`Suggested question: ${question}`}
        >
          {question}
        </Button>
      ))}
    </div>
  )
}
