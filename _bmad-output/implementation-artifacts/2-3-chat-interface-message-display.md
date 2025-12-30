# Story 2.3: Chat Interface & Message Display

Status: done

## Story

As a **user**,
I want **to see a clean chat interface where I can view my conversation**,
So that **I can easily read and follow the CFO bot's responses**.

## Acceptance Criteria

1. **Given** I am on the chat page
   **When** the page loads
   **Then** I see a centered chat area (max-width ~800px)
   **And** I see a fixed input area at the bottom
   **And** I see example questions if no conversation exists

2. **Given** messages exist in the conversation
   **When** I view the chat
   **Then** user messages appear right-aligned with accent background
   **And** assistant messages appear left-aligned with white background

3. **Given** the assistant is responding
   **When** the response is streaming
   **Then** I see a typing indicator (animated dots) immediately
   **And** text appears progressively as it streams
   **And** the chat auto-scrolls to follow new content

4. **Given** I scroll up during streaming
   **When** new content arrives
   **Then** auto-scroll is paused so I can read
   **And** I see a "scroll to bottom" indicator

## Tasks / Subtasks

- [x] Task 1: Create ChatMessage component (AC: #2)
  - [x] Create `src/components/chat/ChatMessage.tsx`
  - [x] Implement `user` variant (right-aligned, accent background)
  - [x] Implement `assistant` variant (left-aligned, white background)
  - [x] Support markdown rendering in messages
  - [x] Display timestamp on hover
  - [x] Accept optional `className` prop
  - [x] Create `src/components/chat/ChatMessage.test.tsx`

- [x] Task 2: Create TypingIndicator component (AC: #3)
  - [x] Create `src/components/chat/TypingIndicator.tsx`
  - [x] Implement three-dot bounce animation (1.2s cycle)
  - [x] Position like assistant message (left-aligned)
  - [x] Accept optional `className` prop
  - [x] Create `src/components/chat/TypingIndicator.test.tsx`

- [x] Task 3: Create ChatInput component (AC: #1)
  - [x] Create `src/components/chat/ChatInput.tsx`
  - [x] Text input with placeholder "Ask your CFO anything..."
  - [x] Send button (icon or text)
  - [x] Submit on Enter key or button click
  - [x] Clear input after send
  - [x] Disable while sending
  - [x] Accept optional `className` prop
  - [x] Create `src/components/chat/ChatInput.test.tsx`

- [x] Task 4: Create ChatContainer component (AC: #1, #3, #4)
  - [x] Create `src/components/chat/ChatContainer.tsx`
  - [x] Centered layout with max-width 800px
  - [x] Fixed input area at bottom
  - [x] Scrollable message area
  - [x] Auto-scroll on new messages
  - [x] Pause auto-scroll when user scrolls up
  - [x] Show scroll-to-bottom indicator when paused
  - [x] Accept optional `className` prop
  - [x] Create `src/components/chat/ChatContainer.test.tsx`

- [x] Task 5: Create EmptyState component (AC: #1)
  - [x] Create `src/components/chat/EmptyState.tsx`
  - [x] Warm welcome message
  - [x] 2-3 example questions as clickable buttons
  - [x] Style consistent with UX spec
  - [x] Accept optional `className` and `onQuestionClick` props
  - [x] Create `src/components/chat/EmptyState.test.tsx`

- [x] Task 6: Create barrel export for chat components
  - [x] Create `src/components/chat/index.ts`
  - [x] Export all chat components

- [x] Task 7: Integrate chat components into chat page
  - [x] Update `src/app/(dashboard)/chat/page.tsx`
  - [x] Use Vercel AI SDK `useChat()` hook for state
  - [x] Connect ChatInput to send functionality
  - [x] Render messages with ChatMessage component
  - [x] Show TypingIndicator when loading
  - [x] Show EmptyState when no messages

- [x] Task 8: Write integration tests
  - [x] Test empty state displays example questions
  - [x] Test message rendering (user and assistant)
  - [x] Test input focus and submit behavior

## Dev Notes

### Vercel AI SDK Integration (CRITICAL)

This story sets up the chat UI that will connect to AI in Story 2.4. Use the Vercel AI SDK's `useChat()` hook for state management:

```typescript
// src/app/(dashboard)/chat/page.tsx
'use client'

import { useChat } from 'ai/react'

import { ChatContainer, ChatMessage, ChatInput, TypingIndicator, EmptyState } from '@/components/chat'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat'  // Will be implemented in Story 2.4
  })

  return (
    <ChatContainer>
      {messages.length === 0 ? (
        <EmptyState onQuestionClick={(question) => {
          // Pre-fill input with clicked question
        }} />
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              variant={message.role === 'user' ? 'user' : 'assistant'}
            />
          ))}
          {isLoading && <TypingIndicator />}
        </>
      )}
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </ChatContainer>
  )
}
```

### ChatMessage Component Pattern

```typescript
// src/components/chat/ChatMessage.tsx
'use client'

import { cn } from '@/lib/utils'

import type { Message } from 'ai'

interface ChatMessageProps {
  message: Message
  variant?: 'user' | 'assistant'
  className?: string
}

export function ChatMessage({
  message,
  variant = 'assistant',
  className
}: ChatMessageProps) {
  const isUser = variant === 'user'

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-md py-sm',
          isUser
            ? 'bg-accent text-accent-foreground'
            : 'bg-white border border-border shadow-sm'
        )}
      >
        <div className="prose prose-sm max-w-none">
          {message.content}
        </div>
        <time className="text-xs text-muted-foreground mt-xs block opacity-0 hover:opacity-100 transition-opacity">
          {new Date(message.createdAt ?? Date.now()).toLocaleTimeString()}
        </time>
      </div>
    </div>
  )
}
```

### TypingIndicator Animation Pattern

```typescript
// src/components/chat/TypingIndicator.tsx
'use client'

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div className="bg-white border border-border rounded-lg px-md py-sm shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
```

### ChatContainer with Auto-Scroll Pattern

```typescript
// src/components/chat/ChatContainer.tsx
'use client'

import { useRef, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  children: React.ReactNode
  className?: string
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUserScrolled(false)
  }

  useEffect(() => {
    if (!userScrolled) {
      scrollToBottom()
    }
  }, [children, userScrolled])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
    if (!isNearBottom) {
      setUserScrolled(true)
    }
  }

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-md py-lg"
      >
        <div className="max-w-chat mx-auto space-y-lg">
          {children}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-4 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

### ChatInput Component Pattern

```typescript
// src/components/chat/ChatInput.tsx
'use client'

import { FormEvent, KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  className
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form && value.trim()) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className={cn('border-t bg-background p-md', className)}>
      <form onSubmit={onSubmit} className="max-w-chat mx-auto">
        <div className="flex gap-sm items-end">
          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask your CFO anything..."
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
```

### EmptyState Component Pattern

```typescript
// src/components/chat/EmptyState.tsx
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
    <div className={cn('flex flex-col items-center justify-center py-2xl', className)}>
      <h2 className="text-h2 text-primary mb-md">
        Welcome to your CFO Bot
      </h2>
      <p className="text-body text-muted-foreground mb-lg max-w-md text-center">
        Ask me anything about your agency's finances. I'm here to help you understand your numbers and make better decisions.
      </p>
      <div className="flex flex-col gap-sm w-full max-w-md">
        <p className="text-body-small text-muted-foreground text-center mb-xs">
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
```

### Project Structure Notes

**Files to Create:**
```
src/components/chat/ChatMessage.tsx
src/components/chat/ChatMessage.test.tsx
src/components/chat/TypingIndicator.tsx
src/components/chat/TypingIndicator.test.tsx
src/components/chat/ChatInput.tsx
src/components/chat/ChatInput.test.tsx
src/components/chat/ChatContainer.tsx
src/components/chat/ChatContainer.test.tsx
src/components/chat/EmptyState.tsx
src/components/chat/EmptyState.test.tsx
src/components/chat/index.ts
```

**Files to Modify:**
```
src/app/(dashboard)/chat/page.tsx (integrate chat components)
```

### Tailwind Custom Classes (Already Configured)

From previous stories, these spacing/sizing tokens should exist in `tailwind.config.ts`:
- `max-w-chat`: 800px (chat area max-width)
- `px-md`, `py-md`, `py-lg`, `py-xl`, `py-2xl`: spacing tokens
- `gap-sm`, `gap-lg`: gap tokens
- `text-h2`, `text-body`, `text-body-small`: typography tokens

If any are missing, check `tailwind.config.ts` and add them per the UX spec.

### Import Order (MANDATORY)

```typescript
// 1. React/Next
'use client'

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react'

// 2. External packages
import { useChat } from 'ai/react'
import { Send, ChevronDown } from 'lucide-react'

// 3. Internal @/ aliases
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// 4. Relative imports
import { ChatMessage } from './ChatMessage'

// 5. Types (last)
import type { Message } from 'ai'
```

### Previous Story Intelligence

**From Story 2.2 (Agency Profile Management):**
- `useTransition` pattern for loading states
- Toast notifications via sonner for feedback
- Form validation patterns with inline errors
- Settings page wrapper with proper layout
- Server Component vs Client Component separation

**From Story 2.1 (Onboarding Flow):**
- Step-by-step UI patterns
- Progress indication
- Profile data fetching and storage
- Navigation after completion

**From Epic 1 Retrospective:**
- Code review is mandatory - expect 5-8 issues per story
- Import order violations are the most common issue
- Never expose raw errors to users
- All components must accept optional `className` prop
- Use `cn()` for class merging

### Git Intelligence

**Recent Commits:**
- `fda5c43`: Stories 1-5, 2-1, 2-2 - Password reset, onboarding, agency profile
- `ef3027b`: Story 1-4 User Login & Logout with security fixes
- `a408944`: Stories 1-2 and 1-3 with code review fixes

**Patterns Established:**
- Component files follow PascalCase naming
- Test files co-located with source files
- Barrel exports (`index.ts`) for feature folders
- shadcn/ui components in `src/components/ui/`
- Feature components in `src/components/<feature>/`

### UX Design Requirements (from UX Spec)

**Visual Design:**
- Primary (Deep Navy): `#1e3a5f`
- Accent (Warm Gold): `#d4a574`
- Background: `#fafaf9` (warm off-white)
- Surface: `#ffffff` (cards, bubbles)
- Text Primary: `#2d3748`
- Text Secondary: `#718096`

**Chat Layout:**
- Centered container, max-width 800px
- Messages with 16px internal padding
- 12px gap between consecutive messages
- 24px gap between different speakers
- Input area fixed to bottom with comfortable padding

**Animation:**
- Typing indicator: Three-dot sequential bounce (1.2s cycle)
- Streaming: Text appears progressively
- Auto-scroll: Smooth behavior
- Scroll-to-bottom button: Visible when scrolled up

**Accessibility:**
- Semantic HTML structure
- ARIA live regions for streaming responses
- Keyboard navigable
- Focus management

### Technical Guardrails

**Architecture Compliance:**
- Use `useChat()` from Vercel AI SDK for state management
- NO direct API calls - use the hook's built-in functionality
- Streaming responses handled automatically by the SDK
- Messages array managed by the hook

**Component Requirements:**
- Always accept optional `className` prop
- Use `cn()` for class merging
- Use `interface` for props (not `type`)
- Default values in destructuring

**Testing:**
- Co-locate test files with source files
- Test naming: `it('[verb]s [expected behavior]')`
- Mock `useChat()` hook in tests

### Anti-Patterns to Avoid

- Do NOT manage message state manually - use `useChat()`
- Do NOT make direct fetch calls - the hook handles API communication
- Do NOT violate import order
- Do NOT forget to handle loading state with TypingIndicator
- Do NOT forget scroll behavior (auto-scroll + pause on user scroll)
- Do NOT forget empty state with example questions
- Do NOT create fixed layouts that break on different screen sizes
- Do NOT forget keyboard accessibility (Enter to send)

### Dependencies to Install

The Vercel AI SDK should already be installed. If not:
```bash
npm install ai @ai-sdk/openai
```

### Validation Checklist

Before marking complete:
- [ ] ChatMessage renders user variant (right-aligned, accent background)
- [ ] ChatMessage renders assistant variant (left-aligned, white background)
- [ ] TypingIndicator shows animated three-dot bounce
- [ ] ChatInput submits on Enter and button click
- [ ] ChatInput clears after submit
- [ ] ChatContainer auto-scrolls on new messages
- [ ] ChatContainer pauses auto-scroll when user scrolls up
- [ ] Scroll-to-bottom button appears when scrolled up
- [ ] EmptyState shows example questions
- [ ] Example questions are clickable
- [ ] Chat page integrates all components correctly
- [ ] All components accept className prop
- [ ] Unit tests pass for all components
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: _bmad-output/project-context.md#Component Patterns]
- [Source: _bmad-output/implementation-artifacts/2-2-agency-profile-management.md#Dev Agent Record]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- AI SDK v6 migration: Updated from `ai/react` import to `@ai-sdk/react` due to SDK v6 breaking changes
- Message format: Changed from `content` string to `parts` array structure for UIMessage type
- API configuration: Removed deprecated `api` option, using default `/api/chat` endpoint
- State management: Changed from SDK-managed `input` state to external `useState` as per v6 architecture

### Completion Notes List

1. Created 5 chat UI components (ChatMessage, ChatInput, ChatContainer, TypingIndicator, EmptyState) with full test coverage
2. Integrated Vercel AI SDK v6 `useChat()` hook for state management with proper typing
3. Implemented auto-scroll behavior with pause on user scroll and scroll-to-bottom indicator
4. Created 61 unit tests across all components (46 component tests + 15 integration tests)
5. All acceptance criteria satisfied:
   - AC#1: Centered chat area with max-width 800px, fixed input at bottom, example questions shown
   - AC#2: User messages right-aligned with accent background, assistant messages left-aligned with white background
   - AC#3: Typing indicator with three-dot bounce animation, auto-scroll on new content
   - AC#4: Auto-scroll pauses when user scrolls up, scroll-to-bottom button appears
6. Note: Uses AI SDK v6 architecture - Story 2.4 will need to implement `/api/chat` endpoint using new SDK patterns

### File List

**New Files:**
- src/components/chat/ChatMessage.tsx
- src/components/chat/ChatMessage.test.tsx
- src/components/chat/ChatInput.tsx
- src/components/chat/ChatInput.test.tsx
- src/components/chat/ChatContainer.tsx
- src/components/chat/ChatContainer.test.tsx
- src/components/chat/TypingIndicator.tsx
- src/components/chat/TypingIndicator.test.tsx
- src/components/chat/EmptyState.tsx
- src/components/chat/EmptyState.test.tsx
- src/components/chat/index.ts
- src/app/(dashboard)/chat/ChatClient.tsx
- src/app/(dashboard)/chat/ChatClient.test.tsx

**Modified Files:**
- src/app/(dashboard)/chat/page.tsx
- src/app/(dashboard)/layout.tsx (critical layout fix for fixed header)
- package.json (added ai, @ai-sdk/react dependencies)
- package-lock.json

## Change Log

- 2025-12-29: Story implementation complete - Created chat interface components with AI SDK v6 integration
- 2025-12-30: **Code Review Fixes** (11 issues addressed):
  - Fixed ChatMessage timestamp to use optional prop instead of always showing current time
  - Added markdown rendering support (bold, italic, code, lists) to ChatMessage
  - Added ARIA live region (role="log", aria-live="polite") to ChatContainer for accessibility
  - Added aria-label="Send message" to ChatInput button for screen readers
  - Removed eslint-disable comments in ChatClient, using underscore prefix pattern instead
  - Fixed scroll-to-bottom button positioning (changed from bottom-20 to bottom-4)
  - Added min-h-[60vh] to EmptyState for proper vertical centering
  - Added pt-xl top padding to ChatContainer scroll area
  - Added 5 new tests for markdown rendering and timestamp functionality
  - **Critical Layout fix**: Updated dashboard layout to use fixed positioning for main content (`fixed top-14 left-0 right-0 bottom-0`) - this prevents chat messages from going under the fixed header navbar
  - Simplified chat page height to use `h-full` since parent now provides proper context
  - All 202 tests passing, lint clean, build successful
