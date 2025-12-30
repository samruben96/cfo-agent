'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { saveOnboardingStep, completeOnboarding } from '@/actions/onboarding'
import { cn } from '@/lib/utils'

import { OnboardingQuestion } from './OnboardingQuestion'
import { OnboardingProgress } from './OnboardingProgress'

// Onboarding questions configuration
const ONBOARDING_QUESTIONS = [
  {
    fieldName: 'agency_name',
    question: "What's your agency name?",
    inputType: 'text' as const,
    isOptional: false
  },
  {
    fieldName: 'annual_revenue_range',
    question: "What's your annual revenue range?",
    inputType: 'select' as const,
    options: ['Under $500K', '$500K-$1M', '$1M-$2M', '$2M-$5M', 'Over $5M'],
    isOptional: false
  },
  {
    fieldName: 'employee_count',
    question: 'How many employees do you have?',
    inputType: 'number' as const,
    isOptional: false
  },
  {
    fieldName: 'user_role',
    question: "What's your role?",
    inputType: 'select' as const,
    options: ['Owner', 'Office Manager', 'Other'],
    isOptional: false
  },
  {
    fieldName: 'biggest_question',
    question: "What's your biggest financial question?",
    inputType: 'textarea' as const,
    isOptional: false
  },
  {
    fieldName: 'monthly_overhead',
    question: "What's your estimated monthly overhead? (rent, utilities, etc.)",
    inputType: 'currency' as const,
    isOptional: true
  }
] as const

interface OnboardingContainerProps {
  initialStep?: number
  initialAnswers?: Record<string, string | number | null>
  className?: string
}

export function OnboardingContainer({
  initialStep = 0,
  initialAnswers = {},
  className
}: OnboardingContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [answers, setAnswers] = useState<Record<string, string | number | null>>(initialAnswers)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep]
  const totalSteps = ONBOARDING_QUESTIONS.length

  const handleValueChange = (value: string | number | null) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.fieldName]: value
    }))
  }

  const handleNext = () => {
    setError(null)

    startTransition(async () => {
      const result = await saveOnboardingStep(
        currentQuestion.fieldName,
        answers[currentQuestion.fieldName] ?? null,
        currentStep + 1
      )

      if (result.error) {
        setError(result.error)
        return
      }

      if (currentStep === totalSteps - 1) {
        // Last question - complete onboarding
        const completeResult = await completeOnboarding()
        if (completeResult.error) {
          setError(completeResult.error)
          return
        }
        router.push(completeResult.data?.redirectTo || '/chat')
      } else {
        // Move to next question
        setCurrentStep(prev => prev + 1)
      }
    })
  }

  const handleSkip = () => {
    setError(null)

    startTransition(async () => {
      const result = await saveOnboardingStep(
        currentQuestion.fieldName,
        null,
        currentStep + 1
      )

      if (result.error) {
        setError(result.error)
        return
      }

      if (currentStep === totalSteps - 1) {
        // Last question - complete onboarding
        const completeResult = await completeOnboarding()
        if (completeResult.error) {
          setError(completeResult.error)
          return
        }
        router.push(completeResult.data?.redirectTo || '/chat')
      } else {
        // Move to next question
        setCurrentStep(prev => prev + 1)
      }
    })
  }

  return (
    <div className={cn('w-full max-w-lg mx-auto', className)}>
      <Card className="shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          {currentStep === 0 && (
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome! Let&apos;s get to know your agency
              </h1>
              <p className="text-muted-foreground">
                Answer a few quick questions so we can provide personalized financial insights.
              </p>
            </div>
          )}
          <OnboardingProgress
            currentStep={currentStep + 1}
            totalSteps={totalSteps}
          />
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <p className="text-sm text-destructive mb-4">{error}</p>
          )}

          <OnboardingQuestion
            question={currentQuestion.question}
            fieldName={currentQuestion.fieldName}
            inputType={currentQuestion.inputType}
            options={'options' in currentQuestion ? [...currentQuestion.options] : undefined}
            value={answers[currentQuestion.fieldName] ?? null}
            onChange={handleValueChange}
            onNext={handleNext}
            onSkip={currentQuestion.isOptional ? handleSkip : undefined}
            isOptional={currentQuestion.isOptional}
            isLoading={isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
