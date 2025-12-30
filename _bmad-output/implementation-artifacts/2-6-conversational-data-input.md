# Story 2.6: Conversational Data Input

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to provide or update data through the chat conversation**,
So that **I don't need to navigate away to forms**.

## Acceptance Criteria

1. **Given** I'm in the chat
   **When** I say "My rent is $3,500 per month"
   **Then** the AI acknowledges and saves this data
   **And** confirms "Got it, I've updated your monthly rent to $3,500"

2. **Given** I say "I have 8 employees"
   **When** the AI processes this
   **Then** my employee count is updated
   **And** future calculations use this number

3. **Given** the AI needs information to answer my question
   **When** it asks "What's your monthly software spend?"
   **Then** I can answer conversationally
   **And** the data is captured and used immediately

## Tasks / Subtasks

- [x] Task 1: Create data update tools for AI to update user profile (AC: #1, #2)
  - [x] Create `src/lib/ai/tools/profile-tools.ts` with Zod schemas for data extraction
  - [x] Define `updateRent` tool with inputSchema for monthly rent amount
  - [x] Define `updateEmployeeCount` tool with inputSchema for employee count
  - [x] Define `updateMonthlyOverhead` tool with inputSchema for overhead estimate
  - [x] Define `updateSoftwareSpend` tool with inputSchema for software costs
  - [x] Each tool should update the profiles table via Supabase server client

- [x] Task 2: Integrate tools with chat API route (AC: #1, #2, #3)
  - [x] Update `src/app/api/chat/route.ts` to pass tools to `streamText`
  - [x] Pass user ID to tools via context/closure
  - [x] Ensure tools execute automatically when AI calls them
  - [x] Return tool results in the streaming response

- [x] Task 3: Enhance system prompt for data collection (AC: #1, #2, #3)
  - [x] Update `src/lib/ai/prompts.ts` with data collection guidelines
  - [x] Add instructions for when to ask for data vs. when to offer to update
  - [x] Include examples of natural data extraction patterns
  - [x] Add confirmation message guidelines ("Got it, I've updated...")

- [x] Task 4: Create unit tests for profile tools (AC: #1, #2)
  - [x] Create `src/lib/ai/tools/profile-tools.test.ts`
  - [x] Test Zod schema validation for each tool
  - [x] Test tool execute function with mocked Supabase client
  - [x] Test error handling for invalid data

- [x] Task 5: Add integration tests for chat with tools (AC: #1, #2, #3)
  - [x] Update `src/app/api/chat/route.test.ts` with tool calling tests
  - [x] Test that tool calls are included in model messages
  - [x] Test that tool results are returned in response
  - [x] Mock OpenAI to simulate tool calling behavior

- [x] Task 6: Verify build and lint (All ACs)
  - [x] Run `npm run build` - must pass
  - [x] Run `npm run lint` - must pass
  - [x] Run `npm run test` - all tests must pass

## Dev Notes

### CRITICAL: AI SDK v6 Tool Calling Pattern

This story implements AI tool calling to enable the AI to update user data conversationally. The AI SDK v6 provides the `tool()` helper with Zod schemas for defining tools.

**Key Pattern from AI SDK v6:**
```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const updateRent = tool({
  description: 'Update the user\'s monthly rent when they mention their rent cost',
  parameters: z.object({
    amount: z.number().describe('Monthly rent amount in dollars'),
  }),
  execute: async ({ amount }, { userId, supabase }) => {
    // Implementation
  },
})
```

**IMPORTANT:** In AI SDK v6, the tool function uses `parameters` (not `inputSchema`) when using the `tool()` helper. See [AI SDK Core: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling).

### Database Schema Reference

The `profiles` table already has fields for storing this data:
```sql
-- From supabase/migrations/00001_create_profiles.sql
monthly_overhead_estimate DECIMAL(12,2),
employee_count INTEGER,
```

For software spend, we may need to add a new field or use the `monthly_overhead_estimate` field. The developer should check if a new migration is needed for `monthly_software_spend DECIMAL(12,2)`.

### Implementation Strategy

**Option A: Separate Tools per Field (Recommended)**
Create individual tools for each data type. This gives the AI clarity on which tool to use:
- `updateRent` - updates monthly rent (part of overhead)
- `updateEmployeeCount` - updates employee count
- `updateSoftwareSpend` - updates software costs
- `updateMonthlyOverhead` - updates total overhead estimate

**Option B: Single Generic Tool**
One `updateProfileData` tool that handles all field updates. This is more flexible but may be less reliable for AI tool selection.

**Recommendation:** Use Option A for clearer AI behavior and simpler testing.

### File Structure

**Files to Create:**
```
src/lib/ai/tools/profile-tools.ts        # Tool definitions
src/lib/ai/tools/profile-tools.test.ts   # Tool unit tests
src/lib/ai/tools/index.ts                # Barrel export
```

**Files to Modify:**
```
src/app/api/chat/route.ts               # Add tools to streamText
src/app/api/chat/route.test.ts          # Add tool calling tests
src/lib/ai/prompts.ts                   # Add data collection guidelines
```

### Tool Definition Example

```typescript
// src/lib/ai/tools/profile-tools.ts
import { tool } from 'ai'
import { z } from 'zod'

import type { SupabaseClient } from '@supabase/supabase-js'

export function createProfileTools(supabase: SupabaseClient, userId: string) {
  return {
    updateRent: tool({
      description: 'Update the monthly rent cost when the user mentions their rent amount. Use this when the user says something like "My rent is $3,500" or "I pay $4000 in rent".',
      parameters: z.object({
        amount: z.number().positive().describe('Monthly rent amount in dollars'),
      }),
      execute: async ({ amount }) => {
        const { error } = await supabase
          .from('profiles')
          .update({ monthly_overhead_estimate: amount })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateRent', error: error.message })
          return { success: false, message: 'Failed to update rent' }
        }

        return {
          success: true,
          message: `Got it, I've updated your monthly rent to $${amount.toLocaleString()}`
        }
      },
    }),

    updateEmployeeCount: tool({
      description: 'Update the employee headcount when the user mentions how many employees they have. Use this when the user says something like "I have 8 employees" or "We have 12 people".',
      parameters: z.object({
        count: z.number().int().positive().describe('Number of employees'),
      }),
      execute: async ({ count }) => {
        const { error } = await supabase
          .from('profiles')
          .update({ employee_count: count })
          .eq('id', userId)

        if (error) {
          console.error('[ProfileTools]', { action: 'updateEmployeeCount', error: error.message })
          return { success: false, message: 'Failed to update employee count' }
        }

        return {
          success: true,
          message: `Got it, I've updated your employee count to ${count}`
        }
      },
    }),
  }
}
```

### Integrating Tools with streamText

```typescript
// In src/app/api/chat/route.ts
import { createProfileTools } from '@/lib/ai/tools/profile-tools'

// Inside POST handler:
const tools = createProfileTools(supabase, user.id)

const result = streamText({
  model: openai('gpt-5.2'),
  messages: modelMessages,
  system: systemPrompt,
  tools,
  maxSteps: 3, // Allow multi-step tool calls
})
```

### System Prompt Enhancement

Add these guidelines to `prompts.ts`:

```typescript
// Add to createCFOSystemPrompt
`
**Data Collection Guidelines:**
- When users mention specific numbers (rent, employees, software costs), use your tools to save the data
- After saving data, confirm what was saved with a natural message like "Got it, I've updated..."
- When you need data to answer a question, ask conversationally: "What's your monthly software spend?"
- If the user provides data, use the appropriate tool to save it before answering their question
- Be proactive about asking for missing data when it would help answer their question

**Examples:**
- User: "My rent is $3,500/month" → Use updateRent tool, then confirm
- User: "We have 12 employees now" → Use updateEmployeeCount tool, then confirm
- User: "What are my costs?" (missing overhead) → Ask "What's your monthly rent and overhead?"
`
```

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| Server Action Response | N/A - using streaming API route with tools |
| Import Order | Follow: React/Next → External → @/ → Relative → Types |
| Path Aliases | Use `@/` for all imports |
| Test Location | Co-located unit tests, integration tests in route.test.ts |
| Logging | `[ProfileTools]` prefix in console.error |
| Error Handling | Tools return `{ success, message }` - never throw |

### Previous Story Intelligence (Story 2-5)

**Key Decisions:**
- AI SDK v6 with `@ai-sdk/react` imports (NOT 'ai/react')
- GPT-5.2 model for fast, high-quality responses
- `toUIMessageStreamResponse()` for useChat compatibility
- `convertToModelMessages()` converts UIMessage → ModelMessage
- Full conversation history sent with each request

**Files That Interact:**
- `src/app/(dashboard)/chat/ChatClient.tsx` - maintains message state
- `src/app/api/chat/route.ts` - processes conversation history (modification target)
- `src/lib/ai/prompts.ts` - system prompt (modification target)
- `src/lib/ai/openai.ts` - OpenAI client config

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
1. Tool Zod schema validation tests
2. Tool execute function with mocked Supabase
3. Error handling for database failures
4. Validation of return message format

**Integration Tests:**
1. Chat route with tools parameter
2. Tool call flow with mocked OpenAI
3. Multi-step tool calls if needed

**Mock Strategy:**
- Mock Supabase client for unit tests
- Mock OpenAI responses including tool calls
- Use `vi.mock()` for external dependencies

### Anti-Patterns to Avoid

- Do NOT create a separate API endpoint for data updates - use AI tools
- Do NOT store tool state client-side - tools execute server-side only
- Do NOT expose raw database errors to users - return friendly messages
- Do NOT add fields to profiles without checking if migration exists
- Do NOT use throwing errors in tool execute - return error objects

### Dependencies

**Already Installed (from Story 2-4):**
- `ai` (v6.0.3) - AI SDK core (includes `tool` helper)
- `@ai-sdk/react` (v3.0.3) - React hooks
- `@ai-sdk/openai` - OpenAI provider
- `zod` - Schema validation (already in project)

**No new dependencies required.**

### Environment Variables

No new environment variables required. Using existing:
- `OPENAI_API_KEY` - For OpenAI API calls

### Potential Migration Needed

Check if `monthly_software_spend` field exists in profiles table. If not, create migration:

```sql
-- supabase/migrations/00004_add_software_spend.sql
ALTER TABLE public.profiles
ADD COLUMN monthly_software_spend DECIMAL(12,2);

COMMENT ON COLUMN public.profiles.monthly_software_spend IS 'Monthly software/SaaS costs';
```

### Validation Checklist

Before marking complete:
- [x] Profile tools defined with proper Zod schemas
- [x] Tools integrated with chat API route
- [x] System prompt includes data collection guidelines
- [x] `updateRent` tool saves data and confirms
- [x] `updateEmployeeCount` tool saves data and confirms
- [x] Conversational data collection works end-to-end
- [x] Unit tests for all tools pass
- [x] Integration tests for tool calling pass
- [x] Existing tests still pass (235+ tests)
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/project-context.md#Technology Stack]
- [Source: _bmad-output/implementation-artifacts/2-5-conversation-context-follow-ups.md#Dev Notes]
- [AI SDK Core: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK Foundations: Tools](https://ai-sdk.dev/docs/foundations/tools)
- [AI SDK 6 Release Blog](https://vercel.com/blog/ai-sdk-6)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- AI SDK v6 uses `inputSchema` with `zodSchema()` wrapper instead of `parameters`
- AI SDK v6 uses `stopWhen: stepCountIs(n)` instead of `maxSteps: n` for multi-step tool calling

### Completion Notes List

- Created profile tools for AI-driven conversational data input (updateRent, updateEmployeeCount, updateMonthlyOverhead, updateSoftwareSpend)
- Integrated tools with chat API route using AI SDK v6 patterns
- Enhanced system prompt with data collection guidelines and examples
- Added migration for new profile fields (monthly_rent, monthly_software_spend)
- Created comprehensive unit tests (26 tests) for profile tools
- Added integration tests (4 tests) for chat route tool calling
- All 265 tests pass, build and lint pass

### File List

New Files:
- supabase/migrations/00004_add_financial_fields.sql
- src/lib/ai/tools/profile-tools.ts
- src/lib/ai/tools/profile-tools.test.ts
- src/lib/ai/tools/index.ts

Modified Files:
- src/app/api/chat/route.ts
- src/app/api/chat/route.test.ts
- src/lib/ai/prompts.ts
- src/lib/ai/prompts.test.ts (added data collection tests)
- src/types/database.ts (added monthly_rent, monthly_software_spend types)

### Change Log

- 2025-12-29: Implemented Story 2.6 - Conversational Data Input with AI SDK v6 tool calling
- 2025-12-29: Code Review Fixes:
  - Updated src/types/database.ts with monthly_rent and monthly_software_spend fields
  - Added data collection tests to prompts.test.ts (7 new tests)
  - Changed Zod schemas from .positive() to .nonnegative() to allow zero values
  - Added 'en-US' locale to toLocaleString() for consistent number formatting
  - Added zero-value validation tests to profile-tools.test.ts (3 new tests)
  - Updated validation checklist and file list in story
