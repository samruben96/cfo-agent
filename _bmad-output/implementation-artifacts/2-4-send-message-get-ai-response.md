# Story 2.4: Send Message & Get AI Response

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to ask financial questions in natural language and get responses**,
So that **I can get CFO-grade insights without financial expertise**.

## Acceptance Criteria

1. **Given** I am on the chat page with the input focused
   **When** I type a question and press Enter (or click Send)
   **Then** my message appears in the chat
   **And** the input clears
   **And** a typing indicator shows immediately
   **And** the AI response streams in progressively

2. **Given** I ask a question like "What does each employee cost me?"
   **When** the AI responds
   **Then** I receive a clear, contextual answer in plain English
   **And** the response completes within 3 seconds for simple queries (NFR1)

3. **Given** my message fails to send (network error)
   **When** the error occurs
   **Then** I see a friendly error message
   **And** my message is preserved so I can retry

## Tasks / Subtasks

- [x] Task 1: Install and configure OpenAI provider (AC: #1, #2)
  - [x] Install `@ai-sdk/openai` package
  - [x] Create `src/lib/ai/openai.ts` with OpenAI client configuration
  - [x] Add `OPENAI_API_KEY` to `.env.local` and `.env.example`

- [x] Task 2: Create the /api/chat route handler (AC: #1, #2)
  - [x] Create `src/app/api/chat/route.ts`
  - [x] Implement POST handler using Vercel AI SDK `streamText()`
  - [x] Configure system prompt with CFO persona and user context
  - [x] Include agency profile data (agencyName, employeeCount, revenueRange) in system prompt
  - [x] Set appropriate maxTokens and temperature for conversational responses
  - [x] Return streaming response using `toUIMessageStreamResponse()` (v6 API for useChat compatibility)

- [x] Task 3: Create AI system prompts (AC: #2)
  - [x] Create `src/lib/ai/prompts.ts` with CFO system prompt
  - [x] Design prompt to provide clear, contextual financial answers
  - [x] Include instruction for responding in plain English
  - [x] Add context about the agency from profile data

- [x] Task 4: Update ChatClient to handle errors (AC: #3)
  - [x] Add error handling using `useChat()` error state
  - [x] Display toast notification for network errors using sonner
  - [x] Preserve input on error for retry
  - [x] Show friendly error message in chat UI

- [x] Task 5: Create API route tests (AC: #1, #2, #3)
  - [x] Create `src/app/api/chat/route.test.ts`
  - [x] Test successful streaming response
  - [x] Test error handling (missing API key, rate limit)
  - [x] Test request validation

- [x] Task 6: Update integration tests (AC: #1, #2, #3)
  - [x] Update `src/app/(dashboard)/chat/ChatClient.test.tsx` for error handling
  - [x] Test error toast displays on network failure
  - [x] Test input preserved on error

- [x] Task 7: Verify build and lint (All ACs)
  - [x] Run `npm run build` - must pass
  - [x] Run `npm run lint` - must pass
  - [x] Run `npm run test` - all tests must pass

## Dev Notes

### CRITICAL: Vercel AI SDK v6 Architecture

This project uses **Vercel AI SDK v6** which has breaking changes from v3.x. From Story 2-3 implementation:

```typescript
// ChatClient.tsx already uses v6 patterns:
import { useChat } from '@ai-sdk/react'  // NOT 'ai/react'

const {
  messages,
  status,
  sendMessage  // NOT handleSubmit
} = useChat()

// Status check for v6
const isLoading = status === 'submitted' || status === 'streaming'
```

**AI SDK v6 Route Handler Pattern:**
```typescript
// src/app/api/chat/route.ts
import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@/lib/ai/openai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: openai('gpt-5.1'),  // Use GPT-5.1 for fast, high-quality responses
    messages: modelMessages,
    system: '...',
  })

  return result.toUIMessageStreamResponse()  // Required for useChat hook compatibility
}
```

### OpenAI Client Configuration

```typescript
// src/lib/ai/openai.ts
import { createOpenAI } from '@ai-sdk/openai'

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

### CFO System Prompt Design

The system prompt should:
1. Establish CFO persona specialized in insurance agency finances
2. Inject agency context (name, employee count, revenue range)
3. Instruct to respond in plain English, not financial jargon
4. Be conversational and helpful
5. Acknowledge data limitations when appropriate

```typescript
// src/lib/ai/prompts.ts
export function createCFOSystemPrompt(context: {
  agencyName: string | null
  employeeCount: number | null
  revenueRange: string | null
}): string {
  return `You are a knowledgeable CFO assistant for ${context.agencyName || 'an insurance agency'}.

Your role is to help the agency owner understand their finances in simple, plain English.

Agency Context:
- Agency Name: ${context.agencyName || 'Not provided'}
- Employee Count: ${context.employeeCount || 'Not provided'}
- Annual Revenue Range: ${context.revenueRange || 'Not provided'}

Guidelines:
- Respond in clear, conversational language - avoid financial jargon
- Be specific and actionable in your advice
- When you don't have enough data, acknowledge it and ask clarifying questions
- Focus on practical insights an agency owner can use
- If asked about calculations you can't perform yet, explain what data would be needed

Current capabilities are limited - the system will have more financial data in future updates.`
}
```

### Error Handling Pattern

The `useChat()` hook provides error state that must be handled:

```typescript
// ChatClient.tsx updates
import { toast } from 'sonner'

const {
  messages,
  status,
  error,  // Add error state
  sendMessage
} = useChat({
  onError: (error) => {
    toast.error('Failed to send message. Please try again.')
    console.error('[ChatClient] Error:', error.message)
  }
})

// Show error in UI if needed
useEffect(() => {
  if (error) {
    toast.error('Something went wrong. Please try again.')
  }
}, [error])
```

### Request Body Structure (AI SDK v6)

The `useChat()` hook sends this shape to `/api/chat`:
```typescript
{
  messages: [
    { role: 'user', content: 'What does each employee cost me?' },
    // ... previous messages
  ]
}
```

### Performance Requirements

- NFR1: Chat responses return within 3 seconds for simple queries
- Use GPT-4o (GPT-5.2 Instant mode equivalent) for fast responses
- Streaming reduces perceived latency

### Import Order (MANDATORY)

```typescript
// 1. React/Next
import { NextResponse } from 'next/server'

// 2. External packages
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// 3. Internal @/ aliases
import { createCFOSystemPrompt } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

// 4. Relative imports
// (none expected in route.ts)

// 5. Types (last)
import type { Message } from 'ai'
```

### Project Structure Notes

**Files to Create:**
```
src/lib/ai/openai.ts           # OpenAI client configuration
src/lib/ai/prompts.ts          # System prompts
src/app/api/chat/route.ts      # API route handler
src/app/api/chat/route.test.ts # Route tests
```

**Files to Modify:**
```
src/app/(dashboard)/chat/ChatClient.tsx  # Add error handling
src/app/(dashboard)/chat/ChatClient.test.tsx  # Add error tests
package.json  # Add @ai-sdk/openai dependency
.env.example  # Add OPENAI_API_KEY placeholder
```

**Alignment with Architecture:**
- Route placed at `src/app/api/chat/route.ts` per architecture.md
- AI utilities in `src/lib/ai/` per project structure
- Uses Server Actions response pattern for error handling
- Follows import order conventions

### Previous Story Intelligence (Story 2-3)

**Key Decisions Made:**
- AI SDK v6 architecture with `@ai-sdk/react` imports
- `status` check pattern: `status === 'submitted' || status === 'streaming'`
- External `useState` for input (not SDK-managed)
- Profile data already passed to ChatClient but unused (use now)

**Critical Code Review Fixes Applied:**
- Dashboard layout uses fixed positioning: `fixed top-14 left-0 right-0 bottom-0`
- Import order violations were common - be strict
- Never expose raw errors to users
- All components accept optional `className` prop

**Files from Story 2-3 that interact with this story:**
- `src/app/(dashboard)/chat/ChatClient.tsx` - main integration point
- `src/components/chat/TypingIndicator.tsx` - shows during streaming
- `src/components/chat/ChatMessage.tsx` - renders AI responses

### Git Intelligence

**Recent Commits:**
- `fda5c43`: Stories 1-5, 2-1, 2-2 - Password reset, onboarding, agency profile
- `ef3027b`: Story 1-4 User Login & Logout with security fixes

**Patterns Established:**
- Commit messages use conventional format: `feat:`, `fix:`
- Code review fixes are bundled with story completion
- Test files co-located with source files

### Dependencies to Install

```bash
npm install @ai-sdk/openai
```

**Note:** The `ai` package (v6.0.3) and `@ai-sdk/react` (v3.0.3) are already installed.

### Environment Variables

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...  # Your OpenAI API key
```

Add to `.env.example`:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### Testing Strategy

**Unit Tests (Vitest):**
1. Route handler returns streaming response
2. System prompt includes agency context
3. Error handling returns proper error shape
4. Invalid requests are rejected

**Mocking:**
- Mock `@ai-sdk/openai` for deterministic tests
- Mock `streamText` to return controlled responses
- Mock `sonner` toast for error notification tests

### Anti-Patterns to Avoid

- Do NOT use `'use server'` in route.ts - it's a Route Handler, not a Server Action
- Do NOT throw errors from the route - return proper error responses
- Do NOT expose raw error messages to users
- Do NOT forget to handle the streaming response format
- Do NOT use deprecated AI SDK v3 patterns (like `useCompletion`, old import paths)
- Do NOT hardcode the API key - use environment variable

### Validation Checklist

Before marking complete:
- [x] `/api/chat` endpoint exists and handles POST requests
- [x] Streaming responses work with `useChat()` hook
- [x] CFO persona responds in plain English
- [x] Agency context (name, employees, revenue) included in responses
- [x] Error toast shows on network failure
- [x] Differentiated error messages (rate limit, auth, generic)
- [x] Input preserved on error
- [x] All existing tests still pass
- [x] New tests for API route pass
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#AI/LLM Stack Decision]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/2-3-chat-interface-message-display.md#Dev Agent Record]
- [Vercel AI SDK v6 Documentation](https://sdk.vercel.ai/docs)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- AI SDK v6 uses `UIMessage` type, not `Message`
- AI SDK v6 uses `convertToModelMessages()` to convert UIMessage to ModelMessage format for streamText
- AI SDK v6 uses `toUIMessageStreamResponse()` for proper useChat hook compatibility (not toTextStreamResponse or toDataStreamResponse)
- AI SDK v6 maxTokens/temperature moved to provider-level config

### Completion Notes List

- Implemented `/api/chat` endpoint with streaming responses using AI SDK v6
- Created CFO persona system prompt with agency context injection
- Added error handling to ChatClient with toast notifications and input preservation
- All 214 tests pass (9 new API route tests + 3 new error handling tests)
- Build and lint pass

### File List

**New Files:**
- `src/lib/ai/openai.ts` - OpenAI client configuration
- `src/lib/ai/prompts.ts` - CFO system prompt generator
- `src/app/api/chat/route.ts` - API route handler
- `src/app/api/chat/route.test.ts` - API route tests (9 tests)

**Modified Files:**
- `src/app/(dashboard)/chat/ChatClient.tsx` - Added error handling with toast, input preservation
- `src/app/(dashboard)/chat/ChatClient.test.tsx` - Added error handling tests (5 tests: generic, rate limit, auth, console log, input restore)
- `.env.example` - Added OPENAI_API_KEY placeholder
- `package.json` / `package-lock.json` - Added @ai-sdk/openai dependency

## Change Log

- 2025-12-29: Story 2.4 implementation complete - Send Message & Get AI Response
- 2025-12-29: Code review fixes applied:
  - Updated to GPT-5.1 model and toUIMessageStreamResponse()
  - Removed unused props from ChatClient (profile data fetched server-side)
  - Added differentiated error messages (rate limit, auth, generic)
  - Added API key validation warning on module load
  - Fixed project-context.md AI SDK import path
  - Updated test mock to use gpt-5.1
  - Added 2 new error handling tests (rate limit, auth)

