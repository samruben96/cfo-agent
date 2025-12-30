'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface OnboardingQuestionProps {
  question: string
  fieldName: string
  inputType: 'text' | 'number' | 'select' | 'textarea' | 'currency'
  options?: string[]
  value: string | number | null
  onChange: (value: string | number | null) => void
  onNext: () => void
  onSkip?: () => void
  isOptional?: boolean
  isLoading?: boolean
  className?: string
}

export function OnboardingQuestion({
  question,
  fieldName,
  inputType,
  options,
  value,
  onChange,
  onNext,
  onSkip,
  isOptional = false,
  isLoading = false,
  className
}: OnboardingQuestionProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleNext = () => {
    if (!isOptional && !value && value !== 0) {
      setLocalError('This field is required')
      return
    }
    setLocalError(null)
    onNext()
  }

  const handleInputChange = (newValue: string) => {
    setLocalError(null)
    onChange(newValue || null)
  }

  const handleNumberChange = (newValue: string) => {
    setLocalError(null)
    const parsed = parseInt(newValue, 10)
    onChange(isNaN(parsed) ? null : parsed)
  }

  const handleCurrencyChange = (newValue: string) => {
    setLocalError(null)
    const parsed = parseFloat(newValue)
    onChange(isNaN(parsed) ? null : parsed)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Label htmlFor={fieldName} className="text-xl font-semibold text-foreground block">
        {question}
        {isOptional && <span className="text-muted-foreground font-normal text-base ml-2">(Optional)</span>}
      </Label>

      {inputType === 'text' && (
        <Input
          id={fieldName}
          value={value?.toString() || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter your answer..."
          className="text-lg h-12"
          disabled={isLoading}
        />
      )}

      {inputType === 'number' && (
        <Input
          id={fieldName}
          type="number"
          value={value?.toString() || ''}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="0"
          min="0"
          className="text-lg h-12"
          disabled={isLoading}
        />
      )}

      {inputType === 'select' && options && (
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => {
            setLocalError(null)
            onChange(val)
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="text-lg h-12">
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option} className="text-base">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {inputType === 'textarea' && (
        <Textarea
          id={fieldName}
          value={value?.toString() || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Tell us more..."
          className="text-lg min-h-[120px] resize-none"
          disabled={isLoading}
        />
      )}

      {inputType === 'currency' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
          <Input
            id={fieldName}
            type="number"
            value={value?.toString() || ''}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="pl-7 text-lg h-12"
            disabled={isLoading}
          />
        </div>
      )}

      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1 h-12 text-base"
        >
          {isLoading ? 'Saving...' : 'Next'}
        </Button>

        {isOptional && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="h-12 text-base"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  )
}
