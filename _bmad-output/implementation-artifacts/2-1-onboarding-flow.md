# Story 2.1: Onboarding Flow

Status: done

## Story

As a **new user**,
I want **to complete a quick onboarding questionnaire about my agency**,
So that **the CFO bot has basic context to help me**.

## Acceptance Criteria

1. **Given** I just registered and am redirected to onboarding
   **When** I view the onboarding screen
   **Then** I see a welcoming message and the first question

2. **Given** I am in the onboarding flow
   **When** I answer each question (5-8 questions total)
   **Then** I see progress indication (e.g., "Question 3 of 6")
   **And** my answers are saved to my profile

3. **Given** I complete all onboarding questions
   **When** I finish the last question
   **Then** my profile is marked as onboarding_complete
   **And** I am redirected to the main chat interface
   **And** I see a welcome message with my first insight based on my answers

4. **Given** I am partially through onboarding
   **When** I close the browser and return later
   **Then** I continue from where I left off (progress persisted)

5. **Given** I try to access `/chat` without completing onboarding
   **When** the middleware checks my profile
   **Then** I am redirected back to `/onboarding`

## Onboarding Questions

| # | Field Name | Question | Input Type | Required | Options |
|---|------------|----------|------------|----------|---------|
| 1 | agency_name | What's your agency name? | Text input | Yes | N/A |
| 2 | annual_revenue_range | What's your annual revenue range? | Select dropdown | Yes | Under $500K, $500K-$1M, $1M-$2M, $2M-$5M, Over $5M |
| 3 | employee_count | How many employees do you have? | Number input | Yes | N/A |
| 4 | user_role | What's your role? | Select/Button group | Yes | Owner, Office Manager, Other |
| 5 | biggest_question | What's your biggest financial question? | Textarea | Yes | N/A |
| 6 | monthly_overhead | What's your estimated monthly overhead? (rent, utilities, etc.) | Currency input | No (Optional) | N/A |

## Tasks / Subtasks

- [x] Task 1: Add onboarding fields to profiles table migration (AC: #2)
  - [x] Create new migration file: `00003_add_onboarding_step.sql` (profiles already had most fields from Epic 1)
  - [x] Add columns: onboarding_step (integer) - other fields already existed
  - [x] Run migration locally and verify
  - [x] Update TypeScript types from Supabase

- [x] Task 2: Create OnboardingQuestion component (AC: #1, #2)
  - [x] Create `src/components/onboarding/OnboardingQuestion.tsx`
  - [x] Accept props: question, inputType, options, value, onChange, onNext, isOptional
  - [x] Support input types: text, number, select, textarea, currency
  - [x] Include "Next" button with validation
  - [x] Include "Skip" option for optional questions
  - [x] Apply UX theme styling (Professional Warmth)

- [x] Task 3: Create OnboardingProgress component (AC: #2)
  - [x] Create `src/components/onboarding/OnboardingProgress.tsx`
  - [x] Show "Question X of Y" text
  - [x] Include visual progress bar
  - [x] Apply UX theme colors

- [x] Task 4: Create OnboardingContainer component (AC: #1, #2, #3)
  - [x] Create `src/components/onboarding/OnboardingContainer.tsx`
  - [x] Manage current step state
  - [x] Define questions array with all onboarding questions
  - [x] Handle step navigation (next, back if applicable)
  - [x] Call server action to save progress after each question
  - [x] Handle completion flow

- [x] Task 5: Create onboarding server actions (AC: #2, #3, #4)
  - [x] Create `src/actions/onboarding.ts`
  - [x] `saveOnboardingStep()`: Save individual answer + update step number
  - [x] `completeOnboarding()`: Mark profile as onboarding_complete, redirect to chat
  - [x] `getOnboardingProgress()`: Fetch current step and answers for resume
  - [x] Follow `{ data, error }` response pattern

- [x] Task 6: Create onboarding page (AC: #1, #4)
  - [x] Update `src/app/onboarding/page.tsx` (already existed as placeholder)
  - [x] Fetch current onboarding progress on mount
  - [x] Resume from saved step if returning user
  - [x] Render OnboardingContainer with initial data

- [x] Task 7: Create chat page placeholder (AC: #3)
  - [x] Update `src/app/(dashboard)/chat/page.tsx` (already existed as placeholder)
  - [x] Display welcome message with user's agency name
  - [x] Show first insight based on employee_count and annual_revenue
  - [x] Placeholder chat input (full implementation in Story 2.3)

- [x] Task 8: Update middleware for onboarding redirect (AC: #5)
  - [x] Modify `src/middleware.ts`
  - [x] After auth check, query profile for onboarding_complete
  - [x] If not complete and path is not `/onboarding`, redirect to `/onboarding`
  - [x] If complete and path is `/onboarding`, redirect to `/chat`

- [x] Task 9: Update signup flow to redirect to onboarding (AC: #1)
  - [x] Signup already redirects to `/onboarding` (configured in Epic 1)
  - [x] New profiles have onboarding_complete = false by default (trigger in Epic 1)

- [x] Task 10: Write unit tests for onboarding components
  - [x] OnboardingQuestion tests (all input types, validation, skip) - 21 tests
  - [x] OnboardingProgress tests (step display, progress bar) - 9 tests
  - [x] OnboardingContainer tests (step navigation, completion) - 12 tests

- [x] Task 11: Write integration tests for onboarding flow
  - [x] Test middleware redirect behavior for protected routes
  - [x] Test auth page accessibility
  - [x] Test unauthenticated redirect to login

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] E2E tests are placeholder-level - add authenticated user testing for full onboarding flow [e2e/onboarding.e2e.ts]
- [ ] [AI-Review][LOW] Next.js middleware deprecation warning - migrate to proxy convention when upgrading [src/middleware.ts]

## Dev Notes

### Database Schema Addition

```sql
-- Migration: 00007_add_onboarding_fields.sql

ALTER TABLE profiles
ADD COLUMN agency_name TEXT,
ADD COLUMN annual_revenue_range TEXT,
ADD COLUMN employee_count INTEGER,
ADD COLUMN user_role TEXT,
ADD COLUMN biggest_question TEXT,
ADD COLUMN monthly_overhead DECIMAL(10, 2),
ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_step INTEGER DEFAULT 0;

-- Add CHECK constraint for valid revenue ranges
ALTER TABLE profiles
ADD CONSTRAINT valid_revenue_range CHECK (
  annual_revenue_range IS NULL OR
  annual_revenue_range IN ('Under $500K', '$500K-$1M', '$1M-$2M', '$2M-$5M', 'Over $5M')
);

-- Add CHECK constraint for valid user roles
ALTER TABLE profiles
ADD CONSTRAINT valid_user_role CHECK (
  user_role IS NULL OR
  user_role IN ('Owner', 'Office Manager', 'Other')
);
```

### Server Action Pattern (MANDATORY)

```typescript
// src/actions/onboarding.ts
'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResponse<T> = {
  data: T | null
  error: string | null
}

export async function saveOnboardingStep(
  field: string,
  value: string | number | null,
  step: number
): Promise<ActionResponse<{ step: number }>> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      [field]: value,
      onboarding_step: step
      // Note: updated_at handled by DB trigger
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding]', { action: 'saveStep', error: error.message })
    return { data: null, error: 'Failed to save progress' }
  }

  return { data: { step }, error: null }
}

export async function completeOnboarding(): Promise<ActionResponse<{ redirectTo: string }>> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_complete: true
      // Note: updated_at handled by DB trigger
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding]', { action: 'complete', error: error.message })
    return { data: null, error: 'Failed to complete onboarding' }
  }

  return { data: { redirectTo: '/chat' }, error: null }
}

export async function getOnboardingProgress(): Promise<ActionResponse<{
  currentStep: number
  answers: Record<string, string | number | null>
  isComplete: boolean
}>> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('agency_name, annual_revenue_range, employee_count, user_role, top_financial_question, monthly_overhead_estimate, onboarding_complete, onboarding_step')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[Onboarding]', { action: 'getProgress', error: error.message })
    return { data: null, error: 'Failed to fetch progress' }
  }

  return {
    data: {
      currentStep: data.onboarding_step || 0,
      answers: {
        agency_name: data.agency_name,
        annual_revenue_range: data.annual_revenue_range,
        employee_count: data.employee_count,
        user_role: data.user_role,
        biggest_question: data.top_financial_question,
        monthly_overhead: data.monthly_overhead_estimate
      },
      isComplete: data.onboarding_complete || false
    },
    error: null
  }
}
```

### OnboardingQuestion Component Pattern

```typescript
// src/components/onboarding/OnboardingQuestion.tsx
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
    if (!isOptional && !value) {
      setLocalError('This field is required')
      return
    }
    setLocalError(null)
    onNext()
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Label htmlFor={fieldName} className="text-xl font-semibold text-foreground">
        {question}
      </Label>

      {/* Render input based on type */}
      {inputType === 'text' && (
        <Input
          id={fieldName}
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your answer..."
          className="text-lg"
        />
      )}

      {inputType === 'number' && (
        <Input
          id={fieldName}
          type="number"
          value={value?.toString() || ''}
          onChange={(e) => onChange(parseInt(e.target.value) || null)}
          placeholder="0"
          min="0"
          className="text-lg"
        />
      )}

      {inputType === 'select' && options && (
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger className="text-lg">
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
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
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tell us more..."
          className="text-lg min-h-[100px]"
        />
      )}

      {inputType === 'currency' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id={fieldName}
            type="number"
            value={value?.toString() || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || null)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="pl-7 text-lg"
          />
        </div>
      )}

      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Next'}
        </Button>

        {isOptional && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Middleware Update Pattern

```typescript
// src/middleware.ts - ADDITION to existing middleware

// After auth check succeeds, add onboarding check:
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_complete')
  .eq('id', user.id)
  .single()

const isOnboardingPath = request.nextUrl.pathname === '/onboarding'
const isOnboardingComplete = profile?.onboarding_complete ?? false

// Redirect to onboarding if not complete
if (!isOnboardingComplete && !isOnboardingPath) {
  const url = request.nextUrl.clone()
  url.pathname = '/onboarding'
  return NextResponse.redirect(url)
}

// Redirect away from onboarding if already complete
if (isOnboardingComplete && isOnboardingPath) {
  const url = request.nextUrl.clone()
  url.pathname = '/chat'
  return NextResponse.redirect(url)
}
```

### UX Design Requirements (from UX Spec)

**Visual Design:**
- Professional Warmth theme: Deep Navy (#1e3a5f) + Warm Gold (#d4a574)
- Background: Warm off-white (#fafaf9)
- Card Surface: White (#ffffff)
- Inter font family

**Onboarding Flow Principles:**
- "First Win in Five Minutes" - User must get valuable insight in first session
- Never require extensive setup before value
- Every question should feel worth answering
- Warm, welcoming tone throughout

**Empty State for Chat:**
- Warm welcome message
- Example questions visible to inspire
- Never feel cold or empty

**First Insight Generation (AC #3):**
Based on onboarding answers, generate a simple insight like:
- "With {employee_count} employees and {revenue_range} in revenue, your average revenue per employee is approximately ${revenue_per_employee}. Industry benchmarks suggest this should be around $X-Y for agencies your size."

### Project Structure Notes

**Files to Create:**
```
supabase/migrations/00007_add_onboarding_fields.sql
src/actions/onboarding.ts
src/components/onboarding/OnboardingQuestion.tsx
src/components/onboarding/OnboardingQuestion.test.tsx
src/components/onboarding/OnboardingProgress.tsx
src/components/onboarding/OnboardingProgress.test.tsx
src/components/onboarding/OnboardingContainer.tsx
src/components/onboarding/OnboardingContainer.test.tsx
src/components/onboarding/index.ts
src/app/(dashboard)/onboarding/page.tsx
src/app/(dashboard)/chat/page.tsx
```

**Files to Modify:**
```
src/middleware.ts (add onboarding check)
src/types/database.ts (regenerate from Supabase)
```

### Import Order (MANDATORY)

```typescript
// 1. React/Next
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// 2. External packages
// (none for most components)

// 3. Internal @/ aliases
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { saveOnboardingStep, completeOnboarding } from '@/actions/onboarding'
import { cn } from '@/lib/utils'

// 4. Relative imports
import { OnboardingQuestion } from './OnboardingQuestion'
import { OnboardingProgress } from './OnboardingProgress'

// 5. Types (last)
import type { OnboardingAnswers } from '@/types'
```

### Previous Story Intelligence

**From Epic 1 Retrospective:**
- Code review is mandatory - expect 5-8 issues to fix
- Import order violations are common - follow strictly
- Security: Never expose raw database errors to users
- RLS policies use `(select auth.uid())` pattern
- All server actions must return `{ data, error }` shape
- Test count grew from 3 to 76 - maintain trajectory

**From Story 1.5 (Password Reset):**
- Suspense boundary required for useSearchParams (Next.js 16)
- useTransition pattern for server action calls
- Component props: Always accept optional `className`
- Error handling: Friendly messages, never raw errors

**From Story 1.4 (User Login & Logout):**
- Redirect validation pattern established
- isValidRedirectUrl() helper exists

**From Story 1.2 (Database Schema):**
- Migration file naming: `00007_*.sql` (increment from last)
- RLS policies already exist on profiles table
- No additional RLS needed for new columns (same table)

### Testing Strategy

**OnboardingQuestion Tests:**
```typescript
describe('OnboardingQuestion', () => {
  it('renders text input correctly', () => {})
  it('renders number input correctly', () => {})
  it('renders select dropdown with options', () => {})
  it('renders textarea correctly', () => {})
  it('renders currency input with $ prefix', () => {})
  it('validates required fields before next', () => {})
  it('allows skip for optional questions', () => {})
  it('shows loading state during save', () => {})
  it('accepts className prop', () => {})
})
```

**OnboardingProgress Tests:**
```typescript
describe('OnboardingProgress', () => {
  it('displays current step and total', () => {})
  it('renders progress bar with correct width', () => {})
  it('accepts className prop', () => {})
})
```

**OnboardingContainer Tests:**
```typescript
describe('OnboardingContainer', () => {
  it('renders first question initially', () => {})
  it('advances to next question on next click', () => {})
  it('saves answer via server action', () => {})
  it('completes onboarding after last question', () => {})
  it('resumes from saved step', () => {})
  it('redirects to chat on completion', () => {})
})
```

### Anti-Patterns to Avoid

- Do NOT use `any` type anywhere
- Do NOT violate import order from project-context.md
- Do NOT expose raw Supabase error messages
- Do NOT skip validation on required fields
- Do NOT forget loading states during async operations
- Do NOT forget className prop on components
- Do NOT create server actions without `{ data, error }` return shape
- Do NOT access database directly from client components
- Do NOT forget to update TypeScript types after migration

### Validation Checklist

Before marking complete:
- [ ] Migration adds all onboarding fields to profiles
- [ ] TypeScript types regenerated and accurate
- [ ] OnboardingQuestion supports all 5 input types
- [ ] OnboardingProgress shows step X of Y
- [ ] Answers save after each question
- [ ] Returning user resumes from saved step
- [ ] Completion marks profile as onboarding_complete
- [ ] Completion redirects to /chat
- [ ] Chat page shows welcome with first insight
- [ ] Middleware redirects to /onboarding if incomplete
- [ ] Middleware redirects away from /onboarding if complete
- [ ] Unit tests pass for all components
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Server Action Response Shape]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#First-Time Setup Journey]
- [Source: _bmad-output/project-context.md#Import Order]
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2025-12-29.md#Key Patterns]
- [Source: _bmad-output/implementation-artifacts/1-5-password-reset.md#Server Action Pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues

### Completion Notes List

- Database already had most onboarding fields from Epic 1, only added `onboarding_step` column
- Installed shadcn/ui components: textarea, select, progress
- Used field name mapping in server actions to handle column name differences (biggest_question → top_financial_question)
- Chat page generates personalized first insight using revenue-per-employee calculation with industry benchmarks
- Middleware now enforces onboarding completion for all protected routes
- All 118 unit tests pass (42 new onboarding tests + 76 existing)
- Build passes, lint passes

### File List

**New Files:**
- supabase/migrations/00003_add_onboarding_step.sql
- src/actions/onboarding.ts
- src/components/onboarding/OnboardingQuestion.tsx
- src/components/onboarding/OnboardingQuestion.test.tsx
- src/components/onboarding/OnboardingProgress.tsx
- src/components/onboarding/OnboardingProgress.test.tsx
- src/components/onboarding/OnboardingContainer.tsx
- src/components/onboarding/OnboardingContainer.test.tsx
- src/components/onboarding/index.ts
- src/components/ui/textarea.tsx (shadcn)
- src/components/ui/select.tsx (shadcn)
- src/components/ui/progress.tsx (shadcn)
- e2e/onboarding.e2e.ts

**Modified Files:**
- src/types/database.ts (added onboarding_step)
- src/middleware.ts (added onboarding redirect logic)
- src/app/onboarding/page.tsx (updated from placeholder)
- src/app/(dashboard)/chat/page.tsx (updated with personalized welcome)
- e2e/home.e2e.ts (updated chat test for auth redirect)

**Note: Git also contains uncommitted changes from Story 1.5 (Password Reset):**
- src/components/forgot-password-form.tsx (import order, email validation)
- src/components/forgot-password-form.test.tsx (new tests)
- src/components/login-form.tsx (success message display)
- src/components/login-form.test.tsx (updated tests)
- src/components/reset-password-form.tsx (new file)
- src/components/reset-password-form.test.tsx (new file)
- src/app/auth/reset-password/page.tsx (new file)

### Change Log

- 2025-12-29: Implemented complete onboarding flow with 6-question questionnaire, progress persistence, and middleware protection
- 2025-12-29: Code Review - Fixed test act() warnings, corrected Dev Notes documentation, added action items for E2E tests
