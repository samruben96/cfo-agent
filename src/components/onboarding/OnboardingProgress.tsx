'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  className
}: OnboardingProgressProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{progressPercent}%</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  )
}
