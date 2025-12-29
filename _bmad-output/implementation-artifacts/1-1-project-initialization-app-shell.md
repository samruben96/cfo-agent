# Story 1.1: Project Initialization & App Shell

Status: done

## Story

As a **developer**,
I want **the project initialized with proper structure, theming, and basic layout**,
So that **all subsequent features have a consistent foundation to build upon**.

## Acceptance Criteria

1. **Given** the Official Supabase Starter has been initialized
   **When** I run the development server
   **Then** the app loads with the configured UX theme colors (Deep Navy #1e3a5f, Warm Gold #d4a574)
   **And** Tailwind is configured with all design tokens from the UX spec
   **And** the basic layout structure exists (header, main chat area placeholder, collapsible panel placeholder)
   **And** shadcn/ui is installed and configured
   **And** all dependencies are pinned in package.json
   **And** the project follows the directory structure from architecture.md

## Tasks / Subtasks

- [x] Task 1: Initialize project with Official Supabase Starter (AC: #1)
  - [x] Run `npx create-next-app@latest bfi-cfo-bot -e with-supabase`
  - [x] Verify Next.js 15 with App Router is installed (Actually Next.js 16.1.1)
  - [x] Verify TypeScript strict mode is enabled
  - [x] Initialize git repository if not already done
  - [x] Create `.env.local` from `.env.example` with Supabase credentials

- [x] Task 2: Configure Tailwind with UX Spec Theme Colors (AC: #1)
  - [x] Update `tailwind.config.ts` with complete color palette
  - [x] Add primary colors: Deep Navy (#1e3a5f), Primary Light (#3d5a80)
  - [x] Add accent colors: Warm Gold (#d4a574), Coral (#e07a5f)
  - [x] Add neutral colors: Background (#fafaf9), Surface (#ffffff), Text Primary (#2d3748), Text Secondary (#718096), Border (#e2e8f0)
  - [x] Add semantic colors: Success (#48bb78), Warning (#ed8936), Error (#e53e3e), Info (#4299e1)
  - [x] Configure typography with Inter font family
  - [x] Set up spacing tokens based on 4px base unit

- [x] Task 3: Install and Configure shadcn/ui (AC: #1)
  - [x] Run `npx shadcn@latest init`
  - [x] Configure with TypeScript, Tailwind CSS, and default style
  - [x] Install core components: Button, Card, Input, Dialog, Toast (via sonner)
  - [x] Verify `cn()` utility is available in `lib/utils`
  - [x] Update `components.json` with correct paths

- [x] Task 4: Create Directory Structure (AC: #1)
  - [x] Create `src/components/chat/` directory
  - [x] Create `src/components/documents/` directory
  - [x] Create `src/components/connections/` directory
  - [x] Create `src/components/reports/` directory
  - [x] Create `src/components/layout/` directory
  - [x] Create `src/lib/supabase/` with client.ts, server.ts, admin.ts stubs
  - [x] Create `src/lib/ai/` directory
  - [x] Create `src/lib/calculations/` directory
  - [x] Create `src/lib/utils/` directory
  - [x] Create `src/actions/` directory
  - [x] Create `src/hooks/` directory
  - [x] Create `src/types/` directory
  - [x] Create `src/contexts/` directory
  - [x] Create `e2e/` directory for Playwright tests

- [x] Task 5: Create Basic Layout Structure (AC: #1)
  - [x] Create `src/components/layout/Header.tsx` with logo and icon buttons placeholder
  - [x] Create `src/components/layout/CollapsiblePanel.tsx` as placeholder
  - [x] Create `src/components/layout/index.ts` barrel export
  - [x] Update `src/app/(dashboard)/layout.tsx` with header and panel structure
  - [x] Create `src/app/(dashboard)/chat/page.tsx` with centered chat area placeholder

- [x] Task 6: Pin All Dependencies (AC: #1)
  - [x] Audit `package.json` for unpinned versions (^, ~)
  - [x] Pin all dependencies to exact versions
  - [x] Run `npm install` to update `package-lock.json`
  - [x] Verify no version drift in subsequent installs

- [x] Task 7: Install Testing Infrastructure (AC: #1)
  - [x] Install Vitest: `npm install -D vitest @vitejs/plugin-react jsdom`
  - [x] Create `vitest.config.ts` with React and Next.js support
  - [x] Install Playwright: `npm install -D @playwright/test`
  - [x] Create `playwright.config.ts` with browser configuration
  - [x] Create sample test file to verify setup

- [x] Task 8: Verify Development Server (AC: #1)
  - [x] Run `npm run dev` and verify no errors
  - [x] Navigate to localhost and verify theme colors render
  - [x] Verify layout structure displays correctly
  - [x] Test responsive behavior at different breakpoints

## Dev Notes

### Critical Architecture Patterns

**Starter Template Command:**
```bash
npx create-next-app@latest bfi-cfo-bot -e with-supabase
```

**Technology Stack:**
- Next.js 15 (App Router) with TypeScript (strict)
- Supabase PostgreSQL + Auth + Storage
- Tailwind CSS + shadcn/ui (Radix primitives)
- Vercel AI SDK + OpenAI GPT-5.2 (future stories)
- Vitest + Playwright for testing

**UX Theme Colors (CRITICAL - Configure Before Any UI Work):**

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Deep Navy) | `#1e3a5f` | Headers, primary actions |
| Primary Light | `#3d5a80` | Hover states |
| Accent (Warm Gold) | `#d4a574` | CTAs, highlights |
| Accent Alt (Coral) | `#e07a5f` | Attention-getters |
| Background | `#fafaf9` | Warm off-white |
| Surface | `#ffffff` | Cards, elevated elements |
| Text Primary | `#2d3748` | Charcoal for readability |
| Text Secondary | `#718096` | Warm gray for secondary |
| Border | `#e2e8f0` | Subtle dividers |
| Success | `#48bb78` | Positive indicators |
| Warning | `#ed8936` | Attention needed |
| Error | `#e53e3e` | Errors |
| Info | `#4299e1` | Informational |

**Typography:**
- Primary Typeface: Inter
- Type scale: H1 (28px/600), H2 (22px/600), H3 (18px/600), Body (16px/400), Body Small (14px/400), Caption (12px/400)

**Spacing:**
- Base Unit: 4px
- Tokens: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px)

### Supabase Client Separation (MANDATORY)

```typescript
// lib/supabase/client.ts - Browser ONLY
import { createBrowserClient } from '@supabase/ssr'

// lib/supabase/server.ts - Server Components & Actions
import { createServerClient } from '@supabase/ssr'

// lib/supabase/admin.ts - Service role (NEVER in components)
import { createClient } from '@supabase/supabase-js'
```

**RULE:** Never import `admin.ts` in any component.

### Import Order (ENFORCED)

```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External packages
import { useChat } from 'ai/react'

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/button'

// 4. Relative imports
import { ChatMessage } from './ChatMessage'

// 5. Types (last)
import type { User } from '@/types'
```

### Path Aliases

Always use `@/` for project root imports. Never use `../../../`.

### Component Props Pattern

```typescript
interface ComponentProps {
  variant?: 'primary' | 'secondary'
  className?: string  // ALWAYS accept className
}

export function Component({ variant = 'primary', className }: ComponentProps) {
  return <div className={cn('base-styles', className)}>{/* ... */}</div>
}
```

### File Naming Conventions

- Components: PascalCase (`ChatMessage.tsx`)
- Routes: kebab-case folders (`(dashboard)/chat/page.tsx`)
- Utilities: kebab-case (`format-currency.ts`)
- shadcn: lowercase (`button.tsx`)

### Testing Location

- Unit tests: Co-located (`ChatMessage.test.tsx` next to `ChatMessage.tsx`)
- E2E tests: `/e2e/` directory

### Layout Specification (From UX Design)

**Header (Fixed Top):**
- Logo/product name (left)
- Icon buttons (right): Panel toggle, settings, user menu
- Height: 56px
- Subtle bottom border

**Chat Area (Primary):**
- Centered container, max-width 800px
- Messages with comfortable padding (16px)

**Collapsible Panel (Right Side):**
- Width: 280px when open
- Smooth slide animation (200ms)

### Project Structure Notes

Directory structure must match architecture.md:

```
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── connections/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── chat/
│   │   ├── documents/
│   │   ├── connections/
│   │   ├── reports/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── ai/
│   │   ├── calculations/
│   │   └── utils/
│   ├── actions/
│   ├── hooks/
│   ├── types/
│   ├── contexts/
│   └── middleware.ts
├── supabase/
│   ├── config.toml
│   └── migrations/
├── e2e/
└── public/
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction]
- [Source: _bmad-output/project-context.md#Technology Stack]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]

### Environment Variables Required

```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (secrets) - NOT needed for this story
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### Anti-Patterns to Avoid

- Do NOT use `any` type in TypeScript
- Do NOT use relative imports beyond one level (`../../../`)
- Do NOT hardcode secrets
- Do NOT skip pinning dependencies
- Do NOT create components without `className` prop support
- Do NOT mix client/server Supabase imports

### Dependencies to Install

**Core (from starter):**
- next@15.x
- react@19.x
- typescript@5.x
- tailwindcss@3.x
- @supabase/supabase-js
- @supabase/ssr

**Additional Required:**
- Inter font (via next/font or CDN)
- class-variance-authority (for shadcn)
- clsx + tailwind-merge (for cn())

**Testing:**
- vitest
- @vitejs/plugin-react
- jsdom
- @playwright/test

### Validation Checklist

Before marking complete:
- [x] `npm run dev` starts without errors
- [x] Theme colors match UX spec when inspecting elements
- [x] Header, chat area, and panel placeholders render
- [x] shadcn Button component works with custom theme
- [x] All directories exist per architecture spec
- [x] No unpinned dependencies in package.json
- [x] `npm run lint` passes
- [x] Basic Vitest test runs successfully
- [x] Playwright can launch browser

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Clean implementation with no blocking issues.

### Completion Notes List

- Initialized project using Official Supabase Starter (Next.js 16.1.1, React 19.2.3)
- Restructured project to use `src/` directory per architecture spec
- Configured complete UX theme with all colors converted to HSL CSS variables
- Added Inter font via Google Fonts CDN
- Created typography scale and spacing tokens in Tailwind config
- Installed shadcn/ui with Dialog and Sonner toast components
- Created Header and CollapsiblePanel layout components with proper UX dimensions
- Created dashboard route group with chat page placeholder
- Pinned all 28 dependencies to exact versions (no ^ or ~ prefixes)
- Set up Vitest with React Testing Library (3 passing tests)
- Set up Playwright with Chromium browser installed
- Fixed ESLint config to ignore .next build artifacts
- All builds pass, all tests pass, lint passes

### Change Log

- 2025-12-29: Initial implementation of Story 1.1 - Project Initialization & App Shell
- 2025-12-29: Code review fixes applied (see Senior Developer Review below)
- 2025-12-29: Project restructured - removed nested bfi-cfo-bot/bfi-cfo-bot/ folder

### File List

**New Files:**
- bfi-cfo-bot/src/app/(dashboard)/layout.tsx
- bfi-cfo-bot/src/app/(dashboard)/chat/page.tsx
- bfi-cfo-bot/src/components/layout/Header.tsx
- bfi-cfo-bot/src/components/layout/CollapsiblePanel.tsx
- bfi-cfo-bot/src/components/layout/index.ts
- bfi-cfo-bot/src/components/ui/dialog.tsx
- bfi-cfo-bot/src/components/ui/sonner.tsx
- bfi-cfo-bot/src/lib/supabase/admin.ts
- bfi-cfo-bot/src/lib/utils.test.ts
- bfi-cfo-bot/e2e/home.e2e.ts
- bfi-cfo-bot/vitest.config.ts
- bfi-cfo-bot/vitest.setup.ts
- bfi-cfo-bot/playwright.config.ts
- bfi-cfo-bot/.env.local

**Modified Files:**
- bfi-cfo-bot/package.json (pinned all dependencies, added test scripts)
- bfi-cfo-bot/tsconfig.json (updated path aliases for src/)
- bfi-cfo-bot/tailwind.config.ts (complete UX theme colors, typography, spacing)
- bfi-cfo-bot/components.json (updated CSS path for src/)
- bfi-cfo-bot/src/app/globals.css (UX theme CSS variables)
- bfi-cfo-bot/src/lib/utils.ts (fixed env var name)
- bfi-cfo-bot/.env.example (fixed env var name)
- bfi-cfo-bot/eslint.config.mjs (added ignores for build artifacts)

**Directories Created:**
- bfi-cfo-bot/src/components/chat/
- bfi-cfo-bot/src/components/documents/
- bfi-cfo-bot/src/components/connections/
- bfi-cfo-bot/src/components/reports/
- bfi-cfo-bot/src/components/layout/
- bfi-cfo-bot/src/lib/ai/
- bfi-cfo-bot/src/lib/calculations/
- bfi-cfo-bot/src/lib/utils/
- bfi-cfo-bot/src/actions/
- bfi-cfo-bot/src/hooks/
- bfi-cfo-bot/src/types/
- bfi-cfo-bot/src/contexts/
- bfi-cfo-bot/e2e/
- bfi-cfo-bot/src/app/api/
- bfi-cfo-bot/supabase/
- bfi-cfo-bot/supabase/migrations/
- bfi-cfo-bot/src/app/(dashboard)/documents/
- bfi-cfo-bot/src/app/(dashboard)/connections/
- bfi-cfo-bot/src/app/(dashboard)/reports/
- bfi-cfo-bot/src/app/(dashboard)/settings/

**Review Fix Files (Added):**
- bfi-cfo-bot/src/middleware.ts
- bfi-cfo-bot/src/app/(dashboard)/documents/page.tsx
- bfi-cfo-bot/src/app/(dashboard)/connections/page.tsx
- bfi-cfo-bot/src/app/(dashboard)/reports/page.tsx
- bfi-cfo-bot/src/app/(dashboard)/settings/page.tsx
- bfi-cfo-bot/supabase/config.toml
- bfi-cfo-bot/supabase/migrations/.gitkeep
- bfi-cfo-bot/src/app/api/.gitkeep

**Review Fix Files (Modified):**
- bfi-cfo-bot/src/lib/supabase/client.ts (env var name fix)
- bfi-cfo-bot/src/lib/supabase/server.ts (env var name fix)
- bfi-cfo-bot/src/app/layout.tsx (font + metadata fix)
- bfi-cfo-bot/e2e/home.e2e.ts (title expectation fix)

## Senior Developer Review (AI)

**Review Date:** 2025-12-29
**Reviewer:** Claude Opus 4.5 (Adversarial Code Review)
**Outcome:** APPROVED with fixes applied

### Issues Found and Fixed

| # | Severity | Issue | File(s) | Fix Applied |
|---|----------|-------|---------|-------------|
| 1 | HIGH | Env var name mismatch (`PUBLISHABLE_KEY` vs `ANON_KEY`) | `client.ts`, `server.ts` | Changed to `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 2 | HIGH | Wrong font (Geist instead of Inter per UX spec) | `layout.tsx` | Changed to Inter font |
| 3 | HIGH | Wrong app metadata/title | `layout.tsx` | Changed to "BFI CFO Bot" |
| 4 | HIGH | Missing dashboard pages | `(dashboard)/` | Created documents, connections, reports, settings pages |
| 5 | MEDIUM | E2E test expects wrong title | `home.e2e.ts` | Updated to expect "BFI CFO Bot" |
| 6 | MEDIUM | Missing `middleware.ts` | `src/` | Created with auth protection |
| 7 | MEDIUM | Missing `api/` directory | `src/app/` | Created with .gitkeep |
| 8 | MEDIUM | Missing `supabase/` directory | root | Created with config.toml and migrations/ |

### Verification

- [x] `npm run build` passes
- [x] `npm run test` passes (3/3)
- [x] `npm run lint` passes
- [x] All new routes visible in build output

### Notes

~~The nested project structure (`bfi-cfo-bot/bfi-cfo-bot/`) is from running `npx create-next-app` inside an already-created folder.~~

**RESOLVED:** Project restructured - all files moved from nested folder to project root. Build, tests, and lint all pass from new location.

