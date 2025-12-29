---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2025-12-29'
inputDocuments:
  - path: "_bmad-output/planning-artifacts/product-brief-bfi-cfo-bot-2025-12-29.md"
    type: "product-brief"
  - path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
  - path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    type: "ux-design"
workflowType: 'architecture'
project_name: 'bfi-cfo-bot'
user_name: 'Sam'
date: '2025-12-29'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 51 functional requirements across 6 major areas:
- User Management & Onboarding (FR1-FR6): Account lifecycle, tenant isolation
- Data Ingestion (FR7-FR16, FR50-51): Multi-source data collection with on-demand sync
- Document Processing (FR17-FR21): Intelligent parsing with user-assisted clarification
- CFO Intelligence (FR22-FR29, FR46-47): Core calculation engine for financial metrics
- Chat Interface (FR30-FR35, FR48-49): Natural language Q&A with conversation history
- Report Management (FR36-FR41): Generation, storage, and retrieval

**Non-Functional Requirements:**
27 NFRs drive architectural decisions:
- Performance: Sub-3s chat, 30s document processing, responsive UI during async ops
- Security: Encryption at rest/transit, secure OAuth tokens, tenant DB isolation
- Reliability: 99% uptime, calculation accuracy as critical requirement
- Integration: QuickBooks OAuth, graceful degradation
- Scalability: Horizontal scaling ready, efficient queries at scale

**UX Implications:**
- shadcn/ui component library (Tailwind CSS + Radix primitives)
- Chat-first with collapsible panel layout
- Streaming response delivery
- Desktop-first responsive design
- WCAG 2.1 AA accessibility compliance

**Scale & Complexity:**
- Primary domain: Full-stack SaaS Web Application
- Complexity level: Medium
- Estimated architectural components: 8-10 major services/modules

### Technical Constraints & Dependencies

**Declared Stack (from PRD):**
- Database/Backend: Supabase (PostgreSQL + Auth + Storage)
- File Storage: Supabase Storage
- Authentication: Supabase Auth

**Integration Dependencies:**
- QuickBooks Online OAuth 2.0
- PDF/CSV parsing capability
- LLM provider for chat intelligence

### Cross-Cutting Concerns Identified

1. **Multi-Tenancy:** All data operations scoped to authenticated user/tenant
2. **AI/LLM Integration:** Core to chat, document parsing, and intelligent calculations
3. **Async Processing:** Document uploads, QuickBooks sync, report generation
4. **Streaming Delivery:** Real-time chat response rendering
5. **Financial Accuracy:** Calculations must be verifiable and auditable
6. **Error Recovery:** Graceful handling with clear user communication

## Starter Template Evaluation

### Primary Technology Domain

**Full-Stack SaaS Web Application** — Next.js App Router, Supabase backend, AI chat with streaming responses.

### Starter Options Considered

| Starter | Evaluation |
|---------|------------|
| **Official Supabase Starter** | ✅ Selected — Official support, maintained by Vercel/Supabase, App Router ready |
| Nextbase Starter | Comprehensive but over-engineered for MVP |
| Razikus SaaS Template | Production-ready but more opinionated than needed |
| Custom from scratch | Too much setup time, easy to miss best practices |

### Selected Starter: Official Supabase Starter

**Initialization Command:**

```bash
npx create-next-app@latest bfi-cfo-bot -e with-supabase
```

**Rationale:**
- Maintained by Vercel + Supabase teams — guaranteed compatibility
- Uses `supabase-ssr` for proper cookie-based auth across App Router
- shadcn/ui pre-configured — aligns with AI-assisted development
- Minimal opinions — add what we need, not remove what we don't

### Architectural Decisions Provided by Starter

| Category | Decision |
|----------|----------|
| **Language** | TypeScript (strict mode) |
| **Framework** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth (cookie-based via `supabase-ssr`) |
| **Database Client** | `@supabase/supabase-js` |
| **Build** | Turbopack (dev), optimized production builds |

### AI/LLM Stack Decision

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **AI Framework** | Vercel AI SDK | Streaming UI built-in, `useChat()` hook, provider-agnostic |
| **LLM Provider** | OpenAI GPT-5.2 (Instant + Thinking modes) | Latest model, optimized for financial reasoning |
| **Document Extraction** | Zerox library + GPT-5.2 vision | Structured schema extraction, handles messy PDFs |
| **Packages** | `ai` + `@ai-sdk/openai` + `zerox` | Official adapters + document processing |

### Testing Stack Decision

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Unit/Integration** | Vitest | Faster than Jest, native ESM, better Next.js App Router support |
| **E2E Testing** | Playwright | Better streaming UI testing, modern architecture |

*Validated by Test Architect (Party Mode)*

### What We'll Add Post-Initialization

| Need | Solution | Priority |
|------|----------|----------|
| AI Chat | Vercel AI SDK + OpenAI | Day 1 |
| Testing Infrastructure | Vitest + Playwright | Day 1 |
| Custom Theme | Tailwind config with UX spec colors | Day 1 |
| Streaming Chat UI | Custom components using `useChat()` | Core feature |
| PDF/CSV Processing | Supabase Edge Function or external service | Core feature |
| QuickBooks OAuth | Custom OAuth integration | Core feature |

### Theme Customization Requirement

UX spec colors must be configured in `tailwind.config.ts` before any UI work:

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Deep Navy) | `#1e3a5f` | Headers, primary actions |
| Primary Light | `#3d5a80` | Hover states |
| Accent (Warm Gold) | `#d4a574` | CTAs, highlights |
| Accent Alt (Coral) | `#e07a5f` | Attention-getters |
| Background | `#fafaf9` | Warm off-white |
| Text Primary | `#2d3748` | Charcoal for readability |

*Validated by UX Designer (Party Mode)*

### Dependency Management

Pin all dependency versions in `package.json` from Day 1 for reproducible builds.

*Validated by Developer (Party Mode)*

## Core Architectural Decisions

### Decision Priority Summary

**Critical Decisions (Block Implementation):**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Execution Location | Next.js Server Actions | Streaming chat support, Vercel AI SDK native integration |
| State Management | `useChat()` + React Context + URL state | Zero extra dependencies, built for this use case |
| Data Security | RLS on every table | Tenant isolation enforced at database level |
| LLM Provider | OpenAI GPT-5.2 | Instant mode for chat, Thinking mode for complex analysis |
| Document Extraction | Zerox + GPT-5.2 vision | Structured schema extraction from financial PDFs |

**Important Decisions (Shape Architecture):**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Real-time Updates | Supabase Realtime (DB changes) + Polling (external systems) | Native integration, appropriate for each data source |
| Error Handling | Typed errors server-side, toast notifications client-side | Never expose raw errors to users |
| Hosting | Vercel | Native Next.js support, automatic deploys |
| CI/CD | Push to main → GitHub Actions (test/lint) → Vercel auto-deploy | No PR workflow needed for solo dev |
| Environment Strategy | Single Supabase project | MVP velocity; revisit when onboarding beta users with real data |

### Data Architecture

**Database:** Supabase PostgreSQL with Row Level Security

**RLS Strategy:**
- Every table gets user-scoped RLS policy
- Service role reserved for admin operations only
- All queries automatically scoped to `auth.uid() = user_id`

**Real-time Strategy:**
- Supabase Realtime for database row changes (document processing status)
- Polling for external system status (QuickBooks sync)

### API & Communication Patterns

**Server Actions for:**
- Chat streaming (Vercel AI SDK `streamText()`)
- Document processing (MVP, migrate to Edge Function if timeout issues)
- QuickBooks sync triggers
- Report generation

**Error Handling Pattern:**
- Server: Try/catch → return typed `{ error: string }` or throw
- Client: Toast notifications via shadcn/ui sonner
- Logging: Server-side details, user-friendly messages client-side

### Frontend Architecture

**State Management:**
- `useChat()` hook for conversation state (messages, input, loading)
- React Context for auth/user session (Supabase provides this)
- URL state for navigation (panel open/closed, shareable)

**Component Architecture:**
- shadcn/ui primitives as foundation
- Custom chat components (ChatMessage, RichResponseCard, TypingIndicator)
- UX spec colors configured in `tailwind.config.ts`

### Infrastructure & Deployment

**Hosting:** Vercel
- Automatic deploys on push to main
- Preview deploys available for branch testing
- Edge network for global performance

**CI/CD Pipeline:**
```
Push to main → GitHub Actions (Vitest + ESLint) → Vercel deploy
```

**Environment Configuration:**
- Single Supabase project for dev + prod
- Environment variables differentiate local vs production
- OpenAI API key shared with rate limits

### Document Processing Architecture

**Zerox Integration:**
- PDF → Images → GPT-5.2 vision → Structured JSON
- Schema-based extraction for P&L data
- Handles tables, charts, messy formatting

**Processing Flow:**
1. User uploads PDF via chat or drag-drop
2. Server Action receives file, stores in Supabase Storage
3. Zerox processes document with defined schema
4. Extracted data stored in PostgreSQL
5. Supabase Realtime notifies client of completion
6. Chat continues with extracted context

**Contingency:** If Zerox + Vercel has deployment issues (system deps), fallback to Railway microservice or direct GPT-5.2 vision API calls.

### Deferred Decisions (Post-MVP)

| Decision | Trigger to Revisit |
|----------|-------------------|
| Supabase Edge Functions | When Server Actions hit 30s timeout limits |
| Dedicated OCR service | If Zerox quality insufficient for specific document types |
| o3 reasoning model | For complex "what-if" scenario analysis |
| Multiple Supabase projects | When onboarding beta users with real financial data |

### Sprint 1 Priorities (From Party Mode Review)

| Priority | Task | Owner |
|----------|------|-------|
| Day 1 | Test Zerox + Vercel deployment compatibility | Developer |
| Day 1 | Implement RLS policy test suite | Test Architect |
| Day 1 | Configure UX spec colors in Tailwind | Developer |
| Document | Zerox fallback plan (Railway/microservice) | Architect |

*All decisions validated by Party Mode team review*

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (PostgreSQL/Supabase):**
```sql
-- Tables: plural, snake_case
users, chat_messages, financial_documents

-- Columns: snake_case
user_id, created_at, is_active

-- Foreign keys: table_id format
user_id (references users.id)
```

**TypeScript/Code:**
```typescript
// Variables & functions: camelCase
const userId = "123"
function getUserData() {}

// Components & Classes: PascalCase
function ChatMessage() {}
class UserService {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3

// Types/Interfaces: PascalCase
interface User {}
type ChatMessage = {}
```

**Files:**
```
# Components: PascalCase
components/chat/ChatMessage.tsx

# Routes: kebab-case folders
app/(dashboard)/chat/page.tsx

# Utilities: kebab-case
lib/utils/format-currency.ts

# shadcn components: lowercase (their convention)
components/ui/button.tsx
```

### Structure Patterns

**Component Organization (Feature-Based):**
```
components/
  chat/
    ChatMessage.tsx
    ChatInput.tsx
    TypingIndicator.tsx
    index.ts              # Barrel export
  documents/
    DocumentUpload.tsx
    DocumentList.tsx
    index.ts
  ui/                     # shadcn primitives
    button.tsx
    card.tsx
```

**Test Location (Co-located):**
```
components/
  chat/
    ChatMessage.tsx
    ChatMessage.test.tsx  # Unit tests next to source
e2e/
  chat.e2e.ts             # Playwright E2E tests
```

### Import Patterns

**Import Order (Enforced):**
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External packages
import { createClient } from '@supabase/supabase-js'
import { useChat } from 'ai/react'

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'

// 4. Relative imports
import { ChatMessage } from './ChatMessage'

// 5. Types (last)
import type { User } from '@/types'
```

**Path Alias Rule:** Always use `@/` for project root imports. Never use `../../../`.

### API Response Patterns

**Server Action Response Shape:**
```typescript
// Always return this shape
type ActionResponse<T> = {
  data: T | null
  error: string | null
}

// Success
return { data: user, error: null }

// Error
return { data: null, error: "Failed to fetch user" }
```

**Explicit Return Types:** Required on all Server Actions and API functions.

### Environment Variable Patterns

```bash
# Public (exposed to browser) - NEXT_PUBLIC_ prefix required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (never in browser) - no prefix
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

**Rule:** If it lacks `NEXT_PUBLIC_`, it MUST NOT be imported client-side.

### Supabase Client Patterns

```typescript
// lib/supabase/client.ts - Browser client (safe)
import { createBrowserClient } from '@supabase/ssr'

// lib/supabase/server.ts - Server client (safe)
import { createServerClient } from '@supabase/ssr'

// lib/supabase/admin.ts - Service role (dangerous, server only)
import { createClient } from '@supabase/supabase-js'
```

**Rule:** Never import `admin.ts` in components. Only in Server Actions requiring cross-tenant access.

### Component Props Patterns

```typescript
interface ChatMessageProps {
  message: Message
  variant?: 'user' | 'assistant'
  className?: string  // Always allow className override
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

**Rules:**
- Use `interface` for props (not `type`)
- Accept optional `className` for style overrides
- Use `cn()` utility from shadcn for class merging
- Default values in destructuring

### State Naming Patterns

```typescript
// Consistent naming
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// With useChat()
const { isLoading, error, messages } = useChat()
```

### Date/Time Patterns

- **Store:** ISO 8601 strings in database (`2025-12-29T10:30:00Z`)
- **Display:** Format client-side with user locale
- **Package:** `date-fns` for formatting

### Test Naming Patterns

```typescript
describe('ChatMessage', () => {
  it('renders user message on the right', () => {})
  it('renders assistant message on the left', () => {})
  it('displays timestamp on hover', () => {})
})

// Mocks: prefix with mock
const mockUser: User = { id: '1', name: 'Test User' }
```

**Pattern:** `it('[verb]s [expected behavior]')`

### Logging Patterns

```typescript
// Structured logging with service prefix
console.log('[ChatService]', { action: 'sendMessage', userId, messageLength })
console.error('[DocumentProcessor]', { error: e.message, documentId })

// Never concatenate strings
// ❌ console.log('sending message for user ' + userId)
```

### Enforcement Summary

**All AI Agents MUST:**
- Follow snake_case for database, camelCase for TypeScript
- Use `@/` path aliases, never relative `../../../`
- Return `{ data, error }` from all Server Actions
- Co-locate tests with source files
- Use structured logging with `[ServiceName]` prefix
- Separate Supabase clients (client/server/admin)
- Accept `className` prop on all components

*All patterns validated by Party Mode team review*

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bfi-cfo-bot/
├── README.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.local                    # Local dev (gitignored)
├── .env.example                  # Template for env vars
├── .gitignore
├── .eslintrc.json
├── .prettierrc
│
├── .github/
│   └── workflows/
│       └── ci.yml                # Vitest + ESLint → Vercel
│
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing/marketing page
│   │   │
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts      # Supabase OAuth callback
│   │   │
│   │   ├── (dashboard)/          # Protected route group
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── chat/
│   │   │   │   └── page.tsx      # Main chat interface
│   │   │   ├── documents/
│   │   │   │   └── page.tsx      # Document management
│   │   │   ├── connections/
│   │   │   │   └── page.tsx      # QuickBooks connection
│   │   │   ├── reports/
│   │   │   │   └── page.tsx      # Saved reports
│   │   │   └── settings/
│   │   │       └── page.tsx      # User settings
│   │   │
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts      # Vercel AI SDK streaming endpoint
│   │       ├── quickbooks/
│   │       │   ├── connect/
│   │       │   │   └── route.ts  # OAuth initiation
│   │       │   ├── callback/
│   │       │   │   └── route.ts  # OAuth callback
│   │       │   └── sync/
│   │       │       └── route.ts  # Trigger sync
│   │       └── webhooks/
│   │           └── quickbooks/
│   │               └── route.ts  # QB webhook handler
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── chat/                 # Chat feature components
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatMessage.test.tsx
│   │   │   ├── RichResponseCard.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── index.ts          # Barrel export
│   │   │
│   │   ├── documents/            # Document feature components
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── ProcessingStatus.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── connections/          # Integration components
│   │   │   ├── QuickBooksConnect.tsx
│   │   │   ├── ConnectionStatus.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── reports/              # Report components
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ReportViewer.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── layout/               # Layout components
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       ├── CollapsiblePanel.tsx
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   ├── admin.ts          # Service role (server only)
│   │   │   └── middleware.ts     # Auth middleware helper
│   │   │
│   │   ├── ai/
│   │   │   ├── openai.ts         # OpenAI client config
│   │   │   ├── prompts.ts        # System prompts
│   │   │   └── tools.ts          # AI tool definitions
│   │   │
│   │   ├── quickbooks/
│   │   │   ├── client.ts         # QB API client
│   │   │   ├── oauth.ts          # OAuth flow helpers
│   │   │   └── sync.ts           # Data sync logic
│   │   │
│   │   ├── documents/
│   │   │   ├── zerox.ts          # Zerox integration
│   │   │   ├── parser.ts         # CSV/PDF parsing
│   │   │   └── schema.ts         # Extraction schemas
│   │   │
│   │   ├── calculations/
│   │   │   ├── employee-cost.ts  # Employee cost calculator
│   │   │   ├── ebitda.ts         # EBITDA calculations
│   │   │   ├── payroll-ratio.ts  # Payroll ratio
│   │   │   ├── hiring-analysis.ts
│   │   │   └── index.ts
│   │   │
│   │   └── utils/
│   │       ├── format-currency.ts
│   │       ├── format-date.ts
│   │       ├── cn.ts             # Class name utility
│   │       └── index.ts
│   │
│   ├── actions/                  # Server Actions
│   │   ├── chat.ts               # Chat streaming action
│   │   ├── documents.ts          # Document CRUD
│   │   ├── connections.ts        # Connection management
│   │   ├── reports.ts            # Report generation
│   │   └── user.ts               # User settings
│   │
│   ├── hooks/
│   │   ├── use-supabase.ts       # Supabase client hook
│   │   ├── use-realtime.ts       # Supabase realtime subscription
│   │   └── use-media-query.ts    # Responsive breakpoints
│   │
│   ├── types/
│   │   ├── database.ts           # Supabase generated types
│   │   ├── chat.ts               # Chat message types
│   │   ├── documents.ts          # Document types
│   │   ├── quickbooks.ts         # QB data types
│   │   └── index.ts
│   │
│   ├── contexts/
│   │   └── auth-context.tsx      # Auth state provider
│   │
│   └── middleware.ts             # Next.js middleware (auth)
│
├── supabase/
│   ├── config.toml               # Local Supabase config
│   ├── migrations/
│   │   ├── 00001_create_users.sql
│   │   ├── 00002_create_documents.sql
│   │   ├── 00003_create_financial_data.sql
│   │   ├── 00004_create_chat_history.sql
│   │   ├── 00005_create_connections.sql
│   │   └── 00006_create_reports.sql
│   └── seed.sql                  # Development seed data
│
├── e2e/
│   ├── chat.e2e.ts
│   ├── documents.e2e.ts
│   └── auth.e2e.ts
│
└── public/
    ├── logo.svg
    └── favicon.ico
```

### Requirements to Structure Mapping

| Feature Area | Directories |
|--------------|-------------|
| **User Management (FR1-FR6)** | `app/(auth)/`, `lib/supabase/`, `middleware.ts` |
| **Data Ingestion (FR7-FR16, FR50-51)** | `lib/quickbooks/`, `components/connections/`, `actions/connections.ts` |
| **Document Processing (FR17-FR21)** | `lib/documents/`, `components/documents/`, `actions/documents.ts` |
| **CFO Intelligence (FR22-FR29, FR46-47)** | `lib/calculations/`, `lib/ai/` |
| **Chat Interface (FR30-FR35, FR48-49)** | `components/chat/`, `actions/chat.ts`, `api/chat/` |
| **Report Management (FR36-FR41)** | `components/reports/`, `actions/reports.ts` |

### Architectural Boundaries

**API Boundaries:**
| Boundary | Location | Purpose |
|----------|----------|---------|
| Chat Streaming | `/api/chat/route.ts` | Vercel AI SDK streaming endpoint |
| QuickBooks OAuth | `/api/quickbooks/*` | OAuth flows and sync triggers |
| Webhooks | `/api/webhooks/*` | External service callbacks |
| Data Operations | `/actions/*.ts` | All other mutations via Server Actions |

**Data Boundaries:**
| Client | File | Use Case |
|--------|------|----------|
| Browser Client | `lib/supabase/client.ts` | Client components, RLS enforced |
| Server Client | `lib/supabase/server.ts` | Server Actions, RLS enforced |
| Admin Client | `lib/supabase/admin.ts` | Service role only, never in components |

**Component Boundaries:**
| Folder | Contents | Rules |
|--------|----------|-------|
| `components/ui/` | shadcn primitives only | No business logic |
| `components/chat/` | Chat feature components | Self-contained, barrel export |
| `components/documents/` | Document feature components | Self-contained, barrel export |
| `components/layout/` | App structural components | Shared across routes |

### Integration Points

**Internal Communication:**
- Components → Server Actions → Supabase
- Chat components → `/api/chat/` → OpenAI
- Realtime updates via Supabase subscriptions in `use-realtime.ts`

**External Integrations:**
| Service | Entry Point | Data Flow |
|---------|-------------|-----------|
| OpenAI GPT-5.2 | `lib/ai/openai.ts` | Chat → API route → OpenAI → Streaming response |
| QuickBooks | `lib/quickbooks/client.ts` | OAuth → Sync → PostgreSQL |
| Zerox | `lib/documents/zerox.ts` | Upload → Process → Extract → PostgreSQL |

**Data Flow:**
```
User Input → Chat Component → Server Action → AI Processing → Streaming Response
           ↓
     Document Upload → Zerox Processing → Supabase Storage + PostgreSQL
           ↓
     QuickBooks OAuth → Sync Trigger → Financial Data → PostgreSQL
```

### Database Schema Overview

```sql
-- Core tables (defined in migrations)
users                 -- Supabase Auth managed
documents            -- Uploaded files metadata
financial_data       -- Extracted/synced financial data
chat_history         -- Conversation persistence
connections          -- QuickBooks OAuth tokens
reports              -- Generated report storage
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. Next.js 15 + Supabase + Vercel AI SDK form a well-integrated stack with official support and documentation.

**Pattern Consistency:**
Implementation patterns align with technology choices — Server Actions for mutations, RLS for security, `useChat()` for state, feature-based component organization.

**Structure Alignment:**
Project structure supports all architectural decisions with clear boundaries between features, data access layers, and UI components.

### Requirements Coverage ✅

**Functional Requirements (51 FRs):**
| Category | Count | Coverage |
|----------|-------|----------|
| User Management (FR1-FR6) | 6 | 100% |
| Data Ingestion (FR7-FR16, FR50-51) | 12 | 100% |
| Document Processing (FR17-FR21) | 5 | 100% |
| CFO Intelligence (FR22-FR29, FR46-47) | 10 | 100% |
| Chat Interface (FR30-FR35, FR48-49) | 8 | 100% |
| Report Management (FR36-FR41) | 6 | 100% |

**Non-Functional Requirements (27 NFRs):**
| NFR | Addressed By |
|-----|--------------|
| Performance (NFR1-6) | GPT-5.2 Instant, streaming, Server Actions |
| Security (NFR7-13) | Supabase encryption, RLS, secure OAuth |
| Reliability (NFR14-19) | Vercel/Supabase SLA, error handling patterns |
| Integration (NFR20-23) | QuickBooks lib, graceful degradation |
| Scalability (NFR24-27) | Horizontal scaling ready, efficient queries |

### Implementation Readiness ✅

**Decision Completeness:**
- All critical decisions documented with versions and rationale
- Technology stack fully specified
- Integration patterns defined with code examples

**Structure Completeness:**
- 70+ files mapped in project structure
- All directories defined with clear purposes
- Requirements mapped to specific locations

**Pattern Completeness:**
- Naming conventions comprehensive (database, TypeScript, files)
- Communication patterns specified (API responses, events)
- Process patterns documented (error handling, loading states)

### Gap Analysis

**Critical Gaps:** None identified

**Nice-to-Have (Post-MVP):**
- Detailed database schema (define during Epic 1)
- AI prompt templates (develop iteratively)
- Zerox extraction schemas (define with first document type)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (6 concerns)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Battle-tested technology stack with official integrations
- Clear patterns prevent AI agent conflicts
- Complete project structure eliminates ambiguity
- All requirements mapped to specific locations
- Party Mode validation by all team perspectives

**Sprint 1 Priorities:**
1. Test Zerox + Vercel deployment compatibility
2. Implement RLS policy test suite
3. Configure UX spec colors in Tailwind

*Architecture validated and approved by Party Mode team review*

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-29
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document:**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with 70+ files and directories
- Requirements to architecture mapping (51 FRs, 27 NFRs)
- Validation confirming coherence and completeness

**Implementation Ready Foundation:**
- 15+ architectural decisions made
- 12+ implementation patterns defined
- 6 major architectural components specified
- 100% requirements coverage confirmed

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing bfi-cfo-bot. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Step:**
```bash
npx create-next-app@latest bfi-cfo-bot -e with-supabase
```

**Development Sequence:**
1. Initialize project using the starter template command above
2. Configure Tailwind with UX spec colors
3. Set up Supabase project and environment variables
4. Implement RLS policy test suite (Day 1 priority)
5. Test Zerox + Vercel compatibility (Day 1 priority)
6. Begin feature implementation following architectural decisions

### Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (cookie-based) |
| Storage | Supabase Storage |
| UI | Tailwind CSS + shadcn/ui |
| AI | Vercel AI SDK + OpenAI GPT-5.2 |
| Document Processing | Zerox + GPT-5.2 vision |
| Testing | Vitest + Playwright |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 51 functional requirements supported
- [x] All 27 non-functional requirements addressed
- [x] Cross-cutting concerns handled
- [x] Integration points defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples provided for clarity

---

**Architecture Status:** ✅ READY FOR IMPLEMENTATION

**Next Phase:** Create Epics & Stories, then begin implementation

