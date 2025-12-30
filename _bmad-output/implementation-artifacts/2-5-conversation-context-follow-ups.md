# Story 2.5: Conversation Context & Follow-ups

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to ask follow-up questions that reference our conversation**,
So that **I can drill deeper without repeating context**.

## Acceptance Criteria

1. **Given** I asked "What's my payroll ratio?"
   **When** I follow up with "How does that compare to industry average?"
   **Then** the AI understands "that" refers to my payroll ratio
   **And** provides relevant comparison without me re-stating the topic

2. **Given** I'm in a conversation about employee costs
   **When** I ask "Show me the breakdown"
   **Then** the AI shows detailed breakdown of the previously discussed costs

3. **Given** I ask an unrelated question mid-conversation
   **When** the AI responds
   **Then** it handles the topic switch gracefully
   **And** I can return to the previous topic if needed

## Tasks / Subtasks

- [x] Task 1: Enhance system prompt for contextual understanding (AC: #1, #2)
  - [x] Update `src/lib/ai/prompts.ts` to add explicit instructions for pronoun resolution
  - [x] Add guidelines for maintaining conversational thread awareness
  - [x] Include instructions for asking clarifying questions when context is ambiguous

- [x] Task 2: Add conversation context tests (AC: #1, #2, #3)
  - [x] Create `src/lib/ai/prompts.test.ts` with context-aware prompt tests
  - [x] Test pronoun resolution scenarios ("that", "this", "it")
  - [x] Test implicit subject references ("Show me the breakdown")
  - [x] Test topic switching and returning

- [x] Task 3: Add E2E conversation flow tests (AC: #1, #2, #3)
  - [x] Create `e2e/conversation-context.e2e.ts` for multi-turn scenarios
  - [x] Test follow-up question understanding (skipped - requires auth fixtures)
  - [x] Test context retention across multiple exchanges (skipped - requires auth fixtures)
  - [x] Test graceful topic transitions (skipped - requires auth fixtures)
  - Note: Core E2E tests are written but skipped until Epic 3 provides authenticated test fixtures. Currently 2 basic tests pass (auth redirect, login form accessibility).

- [x] Task 4: Update API route tests for context handling (AC: #1, #2)
  - [x] Update `src/app/api/chat/route.test.ts` with multi-turn message tests
  - [x] Verify all messages sent to OpenAI include conversation history
  - [x] Test context extraction from conversation

- [x] Task 5: Verify build and lint (All ACs)
  - [x] Run `npm run build` - must pass
  - [x] Run `npm run lint` - must pass
  - [x] Run `npm run test` - all tests must pass

## Dev Notes

### CRITICAL: Current Implementation Already Handles Context

The AI SDK v6 implementation from Story 2.4 **already sends full conversation history** with each request. The `useChat()` hook maintains the messages array and sends it to the API route:

```typescript
// ChatClient.tsx - messages array maintained automatically by useChat
const { messages, sendMessage } = useChat()

// route.ts - full history sent to OpenAI
const modelMessages = await convertToModelMessages(messages)
const result = streamText({
  model: openai('gpt-5.1'),
  messages: modelMessages,  // ALL previous messages included
  system: systemPrompt,
})
```

**This story is primarily about:**
1. Enhancing the system prompt to improve contextual understanding
2. Adding comprehensive tests to verify context behavior
3. Documenting the pattern for future stories

### System Prompt Enhancement Pattern

The current system prompt (`src/lib/ai/prompts.ts`) needs explicit context-handling instructions:

```typescript
export function createCFOSystemPrompt(context: AgencyContext): string {
  return `You are a knowledgeable CFO assistant...

**CONVERSATIONAL CONTEXT GUIDELINES:**
- When users use pronouns ("that", "this", "it"), resolve them using conversation history
- When users ask for "more details" or "breakdown", reference the most recent relevant topic
- When users switch topics abruptly, acknowledge the change and address the new topic
- If context is ambiguous, ask a brief clarifying question
- Remember specific numbers, calculations, and topics discussed earlier

**Examples of Context Resolution:**
- User: "What's my payroll ratio?" → AI responds with ratio
- User: "How does that compare?" → Understand "that" = payroll ratio from previous message
- User: "Show me the breakdown" → Show breakdown of whatever was just discussed

${/* rest of existing prompt */}
`
}
```

### Test Scenarios for Context Understanding

**Pronoun Resolution Tests:**
```typescript
describe('Conversation Context', () => {
  it('resolves "that" to previously discussed topic', async () => {
    const messages = [
      { role: 'user', content: 'What is my payroll ratio?' },
      { role: 'assistant', content: 'Your payroll ratio is 45%.' },
      { role: 'user', content: 'How does that compare to industry average?' }
    ]
    // Verify AI understands "that" = payroll ratio
  })

  it('handles implicit subject references', async () => {
    const messages = [
      { role: 'user', content: 'What does each employee cost me?' },
      { role: 'assistant', content: 'Each employee costs $75,000 fully loaded.' },
      { role: 'user', content: 'Show me the breakdown' }
    ]
    // Verify AI shows employee cost breakdown
  })
})
```

### File Structure

**Files to Modify:**
```
src/lib/ai/prompts.ts              # Add context-handling instructions
```

**Files to Create:**
```
src/lib/ai/prompts.test.ts         # Unit tests for prompt generation
e2e/conversation-context.e2e.ts    # E2E multi-turn conversation tests
```

**Files to Update:**
```
src/app/api/chat/route.test.ts     # Add multi-turn context tests
```

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| Server Action Response | N/A - using streaming API route |
| Import Order | Follow: React/Next → External → @/ → Relative → Types |
| Path Aliases | Use `@/` for all imports |
| Test Location | Co-located unit tests, E2E in `/e2e` |
| Logging | `[ServiceName]` prefix in console.error |

### Previous Story Intelligence (Story 2-4)

**Key Decisions:**
- AI SDK v6 with `@ai-sdk/react` imports (NOT 'ai/react')
- `status` check: `status === 'submitted' || status === 'streaming'`
- GPT-5.2 model for fast, high-quality responses (updated from 5.1 per project-context.md)
- `toUIMessageStreamResponse()` for useChat compatibility
- `convertToModelMessages()` converts UIMessage → ModelMessage

**Critical Code Review Fixes Applied:**
- Dashboard layout uses fixed positioning
- Import order strictly enforced
- Never expose raw errors to users
- Differentiated error messages (rate limit, auth, generic)

**Files That Interact:**
- `src/app/(dashboard)/chat/ChatClient.tsx` - maintains message state
- `src/app/api/chat/route.ts` - processes conversation history
- `src/lib/ai/prompts.ts` - system prompt (main modification target)

### Git Intelligence

**Recent Commits:**
- `fda5c43`: Stories 1-5, 2-1, 2-2 - Password reset, onboarding, agency profile
- `ef3027b`: Story 1-4 User Login & Logout with security fixes

**Patterns Established:**
- Commit messages: `feat:` prefix for features
- Test files co-located with source
- Code review fixes bundled with story completion

### Testing Strategy

**Unit Tests (Vitest):**
1. System prompt includes context handling instructions
2. System prompt handles various agency contexts correctly
3. Prompt structure supports pronoun resolution

**E2E Tests (Playwright):**
1. User sends question → receives answer → sends follow-up with pronoun → AI understands context
2. User discusses topic → asks for "breakdown" → AI provides breakdown of discussed topic
3. User switches topics → AI handles gracefully → user returns to previous topic

**Mock Strategy:**
- For unit tests: Test prompt string generation directly
- For E2E: Use real API with mock OpenAI or test against actual OpenAI (if available)

### Anti-Patterns to Avoid

- Do NOT modify the message handling logic - it already works
- Do NOT add client-side context tracking - useChat handles this
- Do NOT implement custom message history - rely on AI SDK
- Do NOT hardcode example conversations in the prompt - keep it generic
- Do NOT add excessive prompt length - balance context guidelines with token efficiency

### Dependencies

No new dependencies required. Using existing:
- `ai` (v6.0.3) - AI SDK core
- `@ai-sdk/react` (v3.0.3) - React hooks
- `@ai-sdk/openai` - OpenAI provider
- `vitest` - Unit testing
- `playwright` - E2E testing

### Environment Variables

No new environment variables required. Using existing:
- `OPENAI_API_KEY` - For OpenAI API calls

### Validation Checklist

Before marking complete:
- [x] System prompt includes explicit context-handling guidelines
- [x] Pronoun resolution instructions added ("that", "this", "it")
- [x] Implicit subject handling instructions added ("show me breakdown")
- [x] Topic switching guidance included
- [x] Unit tests for prompts.ts pass
- [x] Multi-turn conversation tests added to API route tests
- [x] E2E tests verify context retention across messages (skipped pending auth fixtures)
- [x] Existing 214+ tests still pass (234 tests passing)
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/project-context.md#Technology Stack]
- [Source: _bmad-output/implementation-artifacts/2-4-send-message-get-ai-response.md#Dev Notes]
- [AI SDK 6 - Vercel](https://vercel.com/blog/ai-sdk-6)
- [AI SDK Message History Discussion](https://github.com/vercel/ai/discussions/4845)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed Playwright config to add `testMatch: "**/*.e2e.ts"` - E2E tests were not being discovered due to `.e2e.ts` naming convention not matching default patterns

### Completion Notes List

- Enhanced system prompt in `src/lib/ai/prompts.ts` with explicit conversational context guidelines including pronoun resolution, implicit reference handling, and topic switching guidance
- Created comprehensive unit tests in `src/lib/ai/prompts.test.ts` with 14 tests covering basic prompt generation and conversational context handling
- Created E2E tests in `e2e/conversation-context.e2e.ts` for multi-turn conversation scenarios (auth-dependent tests marked as skip until auth fixtures available)
- Added 4 new multi-turn context tests to `src/app/api/chat/route.test.ts` verifying full conversation history is sent to OpenAI
- All 234 unit tests pass (20 more than previous 214+ baseline)
- Build and lint pass with no errors
- Fixed Playwright configuration to discover `.e2e.ts` files

### File List

**Modified:**
- `src/lib/ai/prompts.ts` - Added conversational context guidelines, exported AgencyContext interface, added "remember numbers" instruction
- `src/app/api/chat/route.ts` - Updated GPT model from 5.1 to 5.2
- `src/app/api/chat/route.test.ts` - Added multi-turn conversation context tests, updated GPT mock to 5.2
- `playwright.config.ts` - Added `testMatch: "**/*.e2e.ts"` for test discovery

**Created:**
- `src/lib/ai/prompts.test.ts` - Unit tests for prompt generation (15 tests including remember numbers)
- `e2e/conversation-context.e2e.ts` - E2E conversation context tests (skipped pending auth fixtures)

### Change Log

- 2025-12-29: Story 2-5 implementation complete - Enhanced system prompt with context-handling guidelines, added comprehensive test suite for multi-turn conversation context
- 2025-12-29: Code review fixes applied:
  - Exported `AgencyContext` interface for external use
  - Added "remember specific numbers/calculations" instruction to system prompt
  - Updated GPT model from 5.1 to 5.2 per project-context.md
  - Added test for remember numbers instruction (235 tests now passing)
  - Updated validation checklist to reflect completed status
  - Documented E2E test limitation (skipped pending auth fixtures)
