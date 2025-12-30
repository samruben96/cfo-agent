---
project_name: 'bfi-cfo-bot'
user_name: 'Sam'
date: '2025-12-29'
sections_completed: ['technology_stack', 'critical_rules', 'patterns', 'testing', 'security']
source: 'Generated from architecture.md'
---

# Project Context for AI Agents

_Critical rules and patterns for implementing bfi-cfo-bot. Follow these exactly._

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | Use Server Components by default |
| Language | TypeScript (strict) | No `any`, explicit return types on exports |
| Database | Supabase PostgreSQL | RLS on every table |
| Auth | Supabase Auth | Cookie-based via `supabase-ssr` |
| Storage | Supabase Storage | For document uploads |
| UI | Tailwind CSS + shadcn/ui | Use `cn()` for class merging |
| AI | Vercel AI SDK + OpenAI GPT-5.2 | `useChat()` for state, streaming via Server Actions |
| Document Processing | Zerox + GPT-5.2 vision | Schema-based extraction |
| Testing | Vitest + Playwright | Co-located unit tests, E2E in `/e2e` |
| Hosting | Vercel | Auto-deploy from main |

---

## Critical Implementation Rules

### 1. Supabase Client Separation (CRITICAL)

```typescript
// lib/supabase/client.ts - Browser ONLY
import { createBrowserClient } from '@supabase/ssr'

// lib/supabase/server.ts - Server Components & Actions
import { createServerClient } from '@supabase/ssr'

// lib/supabase/admin.ts - Service role (NEVER in components)
import { createClient } from '@supabase/supabase-js'
```

**RULE:** Never import `admin.ts` in any component. Only use in Server Actions that need cross-tenant access.

### 2. Server Action Response Shape (MANDATORY)

```typescript
// ALL Server Actions must return this shape
type ActionResponse<T> = {
  data: T | null
  error: string | null
}

// Correct
return { data: user, error: null }
return { data: null, error: "Failed to fetch" }

// WRONG - never return raw data or throw
return user  // ❌
throw new Error("...") // ❌
```

### 3. Environment Variables

```bash
# NEXT_PUBLIC_ = exposed to browser (safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# No prefix = server only (secrets)
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

**RULE:** If it doesn't have `NEXT_PUBLIC_`, it MUST NOT be imported in client components.

### 4. Import Order (ENFORCED)

```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External packages
import { useChat } from 'ai/react'

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'

// 4. Relative imports
import { ChatMessage } from './ChatMessage'

// 5. Types (last)
import type { User } from '@/types'
```

### 5. Path Aliases

```typescript
// ALWAYS use @/ for project root
import { Button } from '@/components/ui/button'  // ✅

// NEVER use relative paths beyond one level
import { Button } from '../../../components/ui/button'  // ❌
```

---

## Naming Conventions

### Database (PostgreSQL)
```sql
-- Tables: plural, snake_case
users, chat_messages, financial_documents

-- Columns: snake_case
user_id, created_at, is_active

-- Foreign keys: referenced_table_id
user_id (references users.id)
```

### TypeScript
```typescript
// Variables & functions: camelCase
const userId = "123"
function getUserData() {}

// Components: PascalCase
function ChatMessage() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3

// Types/Interfaces: PascalCase
interface User {}
```

### Files
```
# Components: PascalCase
components/chat/ChatMessage.tsx

# Routes: kebab-case
app/(dashboard)/chat/page.tsx

# Utilities: kebab-case
lib/utils/format-currency.ts

# shadcn: lowercase (their convention)
components/ui/button.tsx
```

---

## Component Patterns

### Props Interface
```typescript
interface ChatMessageProps {
  message: Message
  variant?: 'user' | 'assistant'
  className?: string  // ALWAYS accept className
}

export function ChatMessage({
  message,
  variant = 'assistant',
  className
}: ChatMessageProps) {
  return (
    <div className={cn('base-styles', className)}>
      {/* ... */}
    </div>
  )
}
```

**RULES:**
- Use `interface` for props (not `type`)
- Always accept optional `className`
- Use `cn()` from shadcn for class merging
- Default values in destructuring

### State Naming
```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

## Testing Requirements

### File Location
```
components/
  chat/
    ChatMessage.tsx
    ChatMessage.test.tsx  # Co-located
e2e/
  chat.e2e.ts             # E2E tests separate
```

### Test Naming
```typescript
describe('ChatMessage', () => {
  it('renders user message on the right', () => {})
  it('displays timestamp on hover', () => {})
})
```

Pattern: `it('[verb]s [expected behavior]')`

### Mocks
```typescript
// Prefix with mock
const mockUser: User = { id: '1', name: 'Test' }
```

---

## Security Rules

### RLS Policy Required
Every table MUST have RLS enabled with user-scoped policies:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Use (select auth.uid()) for optimizer caching (2025 best practice)
-- Create SEPARATE policies for each operation (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

**RLS Best Practices:**
- Use `(select auth.uid())` instead of bare `auth.uid()` for Postgres optimizer caching
- Always specify `TO authenticated` role
- Create SEPARATE policies for each operation - never use `FOR ALL`

### Never Expose
- Raw database errors to users
- Stack traces in production
- API keys in client code
- Service role key anywhere except `lib/supabase/admin.ts`

---

## Logging Pattern

```typescript
// Structured logging with service prefix
console.log('[ChatService]', { action: 'sendMessage', userId })
console.error('[DocumentProcessor]', { error: e.message, documentId })

// NEVER concatenate
console.log('sending for user ' + userId)  // ❌
```

---

## Anti-Patterns (NEVER DO)

```typescript
// ❌ Using any
const data: any = ...

// ❌ Relative imports beyond parent
import { x } from '../../../lib/utils'

// ❌ Raw error returns
return { error: e }  // Exposes stack trace

// ❌ Mixing client/server
'use client'
import { createServerClient } from '@supabase/ssr'  // Will fail

// ❌ Hardcoded secrets
const apiKey = "sk-..."

// ❌ Missing RLS
// Creating table without RLS policy
```

---

## Quick Reference

| Need | Pattern |
|------|---------|
| Fetch data (server) | Server Action with `{ data, error }` return |
| Fetch data (client) | `useChat()` or React Query |
| Auth check | `middleware.ts` + Supabase `getUser()` |
| File upload | Supabase Storage + Server Action |
| Real-time | Supabase Realtime subscription |
| Toast notification | shadcn/ui `sonner` |
| Form validation | Zod schema |
| Date formatting | `date-fns` |
| Class merging | `cn()` utility |

---

_Generated from architecture.md on 2025-12-29_
