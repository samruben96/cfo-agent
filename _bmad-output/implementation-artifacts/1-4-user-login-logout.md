# Story 1.4: User Login & Logout

Status: done

## Story

As a **returning user**,
I want **to log in and out of my account securely**,
So that **I can access my data and protect it when I'm done**.

## Acceptance Criteria

1. **Given** I am on the login page
   **When** I enter my valid email and password
   **And** I click "Log In"
   **Then** I am authenticated and redirected to the dashboard/chat
   **And** my session is stored securely in cookies

2. **Given** I enter incorrect credentials
   **When** I click "Log In"
   **Then** I see a friendly error "Invalid email or password"

3. **Given** I am logged in
   **When** I click "Log Out"
   **Then** my session is terminated
   **And** I am redirected to the login page

4. **Given** my session expires
   **When** I try to access a protected route
   **Then** I am redirected to login with return URL preserved

## Tasks / Subtasks

- [x] Task 1: Enhance LoginForm with improved UX (AC: #1, #2)
  - [x] Update redirect from `/protected` to `/chat` (main dashboard)
  - [x] Handle `redirectTo` query param for deep linking back after login
  - [x] Sanitize error messages (never expose raw Supabase errors)
  - [x] Display friendly "Invalid email or password" for auth failures
  - [x] Add email format validation before submission
  - [x] Update button text to "Log In" (verify consistency)
  - [x] Apply UX theme styling (primary button color)

- [x] Task 2: Implement Logout functionality (AC: #3)
  - [x] Create logout Server Action in `src/actions/auth.ts`
  - [x] Add UserMenu dropdown component to Header with logout option
  - [x] Call `supabase.auth.signOut()` on logout
  - [x] Redirect to `/auth/login` after successful logout
  - [x] Clear any client-side state on logout

- [x] Task 3: Session expiration handling (AC: #4)
  - [x] Verify middleware redirects expired sessions to login
  - [x] Ensure `redirectTo` param is preserved for return after re-auth
  - [x] Handle session refresh in middleware (already implemented)

- [x] Task 4: Write unit tests for LoginForm (AC: #1, #2)
  - [x] Test successful login redirects to /chat
  - [x] Test redirectTo query param is followed after login
  - [x] Test invalid credentials show friendly error
  - [x] Test email format validation
  - [x] Test loading state during submission

- [x] Task 5: Write tests for logout (AC: #3)
  - [x] Test logout calls signOut
  - [x] Test redirect to /auth/login after logout
  - [x] Test UserMenu dropdown renders with logout option

## Dev Notes

### Current Implementation Analysis

**Existing LoginForm Location:** `src/components/login-form.tsx`

The Supabase starter provides a functional login form with:
- Email/password inputs
- Supabase Auth signInWithPassword integration
- Redirect to `/protected` on success (NEEDS UPDATE)
- Basic error handling (exposes raw errors - NEEDS FIX)
- Link to forgot password page

**Issues to Fix:**
1. Redirects to `/protected` instead of `/chat`
2. Exposes raw Supabase error messages
3. No logout functionality exists in Header
4. No `redirectTo` query param handling

### Critical Architecture Patterns

**Server Action Response Shape (MANDATORY for auth.ts):**
```typescript
type ActionResponse<T> = {
  data: T | null
  error: string | null
}
```

**Supabase Client Usage:**
```typescript
// Browser components (LoginForm): use client
import { createClient } from "@/lib/supabase/client";

// Server Actions (logout): use server
import { createClient } from "@/lib/supabase/server";
```

**Import Order (ENFORCED):**
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// 2. External packages
// (none for this component)

// 3. Internal @/ aliases
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

// 4. Relative imports
// (none)

// 5. Types (last)
import type { User } from '@/types'
```

### Supabase Auth Error Handling

**Never expose raw errors. Map to friendly messages:**

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to friendly messages
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password');
        return;
      }
      // Generic fallback - never expose raw message
      setError('Unable to sign in. Please try again.');
      return;
    }

    // Get redirectTo from URL or default to /chat
    const redirectTo = searchParams.get('redirectTo') || '/chat';
    router.push(redirectTo);

  } catch {
    setError('Unable to sign in. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Logout Server Action Pattern

**Create `src/actions/auth.ts`:**

```typescript
"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
```

### UserMenu Component Pattern

**Create dropdown in Header using shadcn DropdownMenu:**

```typescript
// src/components/layout/UserMenu.tsx
"use client";

import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="User menu" className={className}>
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Middleware Session Handling

**Already implemented in `src/middleware.ts`:**
- Protected paths redirect to `/auth/login` if no session
- `redirectTo` param preserved in redirect URL
- Session refresh happens automatically
- Auth paths redirect to `/chat` if already authenticated

**No changes needed** - middleware correctly handles session expiration.

### shadcn Components Required

**Verify installed (from Story 1.1):**
- Button ✓
- Card ✓
- Input ✓
- Label ✓

**May need to add:**
```bash
npx shadcn@latest add dropdown-menu
```

### UX Theme Colors Reference

| Element | Token | Value |
|---------|-------|-------|
| Primary Button | primary | #1e3a5f |
| Button Hover | primary-light | #3d5a80 |
| Error Text | destructive | #e53e3e |
| Background | background | #fafaf9 |
| Card Surface | surface | #ffffff |

### Project Structure Notes

**Files to Modify:**
```
src/components/login-form.tsx        # Update redirect, error handling
src/components/layout/Header.tsx     # Replace User button with UserMenu
src/components/layout/index.ts       # Export UserMenu
```

**Files to Create:**
```
src/actions/auth.ts                  # Logout server action
src/components/layout/UserMenu.tsx   # Dropdown with logout
src/components/login-form.test.tsx   # Unit tests
src/components/layout/UserMenu.test.tsx  # Unit tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Server Action Response Shape]
- [Source: _bmad-output/project-context.md#Import Order]
- [Source: src/components/login-form.tsx - Current Implementation]
- [Source: src/middleware.ts - Session Handling]

### Previous Story Intelligence

**From Story 1.3 (User Registration):**
- SignUpForm pattern established with client-side validation
- Error handling pattern: never expose raw Supabase errors
- Import order violations caught in code review - follow strictly
- Unit testing pattern with @testing-library/react
- Email validation regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**From Story 1.2 (Database Schema & RLS):**
- profiles table exists with RLS policies
- Supabase client separation (client.ts, server.ts, admin.ts)
- TypeScript types in `src/types/database.ts`

**From Story 1.1 (Project Initialization):**
- Next.js 16.1.1 with React 19.2.3
- shadcn/ui components installed
- Vitest configured for unit tests
- UX theme colors in Tailwind config

### Git Intelligence

**Recent Commits:**
- `a408944` - feat: Implement Stories 1-2 and 1-3 with code review fixes
- `a4cd5ee` - feat: Project initialization with code review fixes

**Patterns Established:**
- Commit format: `feat:`, `fix:`
- Code review applied before merge
- ESLint + Vitest must pass

### Testing Strategy

**Unit Tests (LoginForm):**
```typescript
// src/components/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './login-form';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
    },
  }),
}));

describe('LoginForm', () => {
  it('shows friendly error for invalid credentials', async () => {
    // Mock failed auth
    // Verify "Invalid email or password" message
  });

  it('redirects to /chat on successful login', async () => {
    // Mock successful auth
    // Verify router.push('/chat') called
  });

  it('respects redirectTo query param', async () => {
    // Set up searchParams with redirectTo=/settings
    // Mock successful auth
    // Verify router.push('/settings') called
  });
});
```

**Unit Tests (UserMenu):**
```typescript
// src/components/layout/UserMenu.test.tsx
describe('UserMenu', () => {
  it('renders user icon button', () => {
    render(<UserMenu />);
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('shows dropdown with logout on click', async () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByLabelText('User menu'));
    await waitFor(() => {
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });
  });
});
```

### Anti-Patterns to Avoid

- ❌ Do NOT expose raw Supabase error messages
- ❌ Do NOT use `any` type for error handling
- ❌ Do NOT forget loading states during submission
- ❌ Do NOT hardcode redirect URLs (use constants or config)
- ❌ Do NOT skip client-side email validation
- ❌ Do NOT import server client in client components
- ❌ Do NOT violate import order from project-context.md

### Validation Checklist

Before marking complete:
- [ ] Login with valid credentials redirects to /chat
- [ ] Login with `redirectTo` param redirects to that path
- [ ] Invalid credentials show "Invalid email or password"
- [ ] Invalid email format shows validation error
- [ ] Logout button appears in Header UserMenu
- [ ] Logout terminates session and redirects to /auth/login
- [ ] Session expiration redirects to login with redirectTo preserved
- [ ] Unit tests pass for LoginForm
- [ ] Unit tests pass for UserMenu
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - implementation proceeded without issues.

### Completion Notes List

- ✅ Task 1: Enhanced LoginForm with improved UX
  - Fixed import order per project-context.md (React/Next first)
  - Changed redirect from `/protected` to `/chat`
  - Added `useSearchParams` for `redirectTo` query param handling
  - Added Suspense boundary to login page for Next.js 16 compatibility
  - Implemented email format validation with regex
  - Sanitized all error messages (never expose raw Supabase errors)
  - Updated button text to "Log In"
  - Used `text-destructive` token for error styling

- ✅ Task 2: Implemented Logout functionality
  - Created `src/actions/auth.ts` with logout server action
  - Created `src/components/layout/UserMenu.tsx` with dropdown menu
  - Integrated UserMenu into Header component
  - Exported UserMenu from layout/index.ts

- ✅ Task 3: Session expiration handling verified
  - Middleware already handles session expiration correctly
  - `redirectTo` param preserved in redirect URL (line 47)
  - Session refresh via `getUser()` call (line 34-36)

- ✅ Task 4: LoginForm unit tests (12 tests)
  - Successful login redirects to /chat
  - `redirectTo` query param followed after login
  - Invalid credentials show "Invalid email or password"
  - Email format validation works
  - Loading state during submission
  - Form elements render correctly

- ✅ Task 5: UserMenu unit tests (5 tests)
  - Renders user icon button with aria-label
  - Shows dropdown with logout option on click
  - Calls logout action when clicked
  - Accepts className prop

### Change Log

- 2025-12-29: Implemented Story 1.4 User Login & Logout
  - Enhanced LoginForm with redirectTo handling, error sanitization, email validation
  - Added logout functionality with server action and UserMenu component
  - Added Suspense boundary for Next.js 16 SSR compatibility
  - Created comprehensive unit tests (17 tests total)
  - All 42 project tests pass, build succeeds, lint clean

### File List

**Modified:**
- src/components/login-form.tsx (redirect, error handling, validation, import order)
- src/components/layout/Header.tsx (integrated UserMenu)
- src/components/layout/index.ts (exported UserMenu)
- src/app/auth/login/page.tsx (added Suspense boundary)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: backlog → review)

**Created:**
- src/actions/auth.ts (logout server action)
- src/components/layout/UserMenu.tsx (dropdown with logout)
- src/components/login-form.test.tsx (12 unit tests)
- src/components/layout/UserMenu.test.tsx (5 unit tests)
- src/types/index.ts (ActionResponse type)

## Senior Developer Review (AI)

**Reviewed by:** Senior Developer Code Review (Adversarial Mode)
**Date:** 2025-12-29
**Outcome:** Changes Requested → Fixed

### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| H1 | HIGH | Open redirect vulnerability - `redirectTo` param not validated | Added `isValidRedirectUrl()` validation function |
| H2 | HIGH | Server action called incorrectly in onClick | Refactored to use `useTransition` pattern |
| M1 | MEDIUM | Logout action has no error handling | Added try/catch with ActionResponse return |
| M2 | MEDIUM | Password field accepts < 6 chars | Added MIN_PASSWORD_LENGTH validation |
| M3 | MEDIUM | sprint-status.yaml not in File List | Updated File List above |
| L1 | LOW | No loading state for logout | Added Loader2 spinner and disabled state |

### Code Changes Applied

**src/components/login-form.tsx:**
- Added `isValidRedirectUrl()` function to prevent open redirect attacks
- Added `MIN_PASSWORD_LENGTH` constant and validation check
- Tests added for redirect URL validation and password length

**src/actions/auth.ts:**
- Wrapped signOut in try/catch
- Returns ActionResponse<null> with error handling
- Only redirects on successful signOut

**src/components/layout/UserMenu.tsx:**
- Added `useTransition` for proper server action invocation
- Added loading spinner (Loader2) during logout
- Button disabled during pending state
- Shows "Logging out..." text during transition

**src/types/index.ts:**
- Created new file with ActionResponse type definition
- Re-exports database types

### Test Coverage Added

- Password length validation (2 tests)
- Redirect URL validation - open redirect prevention (3 tests)
- Logout loading state (1 test)

**New test count:** 18 LoginForm tests, 6 UserMenu tests (24 total for this story)
