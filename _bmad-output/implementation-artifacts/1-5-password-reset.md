# Story 1.5: Password Reset

Status: done

## Story

As a **user who forgot their password**,
I want **to reset my password via email**,
So that **I can regain access to my account**.

## Acceptance Criteria

1. **Given** I am on the login page
   **When** I click "Forgot Password"
   **Then** I am taken to the password reset request page

2. **Given** I enter my registered email and click "Send Reset Link"
   **Then** I see a confirmation "Check your email for reset instructions"
   **And** a password reset email is sent

3. **Given** I click the reset link in my email
   **When** I enter a valid new password and submit
   **Then** my password is updated
   **And** I am redirected to login with a success message

4. **Given** I enter an unregistered email
   **When** I click "Send Reset Link"
   **Then** I still see the same confirmation (security: don't reveal if email exists)

5. **Given** I enter a password less than 6 characters
   **When** I try to submit
   **Then** I see inline validation error

6. **Given** the reset link has expired (after 1 hour)
   **When** I click it
   **Then** I see a friendly error and option to request new link

## Tasks / Subtasks

- [x] Task 1: Create ForgotPasswordForm component (AC: #1, #2, #4)
  - [x] Create `src/components/forgot-password-form.tsx`
  - [x] Add email input with format validation (reuse regex from login)
  - [x] Submit calls `supabase.auth.resetPasswordForEmail()`
  - [x] Always show success message regardless of email existence (security)
  - [x] Add loading state during submission
  - [x] Apply UX theme styling

- [x] Task 2: Create password reset request page (AC: #1)
  - [x] Create `src/app/(auth)/forgot-password/page.tsx`
  - [x] Import and render ForgotPasswordForm
  - [x] Add link back to login page

- [x] Task 3: Create ResetPasswordForm component (AC: #3, #5, #6)
  - [x] Create `src/components/reset-password-form.tsx`
  - [x] Add new password input with min 6 char validation
  - [x] Add confirm password input with match validation
  - [x] Parse `code` from URL params (Supabase sends this)
  - [x] Submit calls `supabase.auth.updateUser({ password })`
  - [x] Handle expired/invalid token error gracefully
  - [x] Redirect to `/auth/login?message=password-updated` on success

- [x] Task 4: Create password reset confirmation page (AC: #3, #6)
  - [x] Create `src/app/(auth)/reset-password/page.tsx`
  - [x] Extract `code` query param using useSearchParams
  - [x] Render ResetPasswordForm
  - [x] Add Suspense boundary (Next.js 16 requirement)

- [x] Task 5: Update login page to show success message (AC: #3)
  - [x] Handle `message=password-updated` query param
  - [x] Display success toast or inline message
  - [x] Auto-clear message after 5 seconds or on form interaction

- [x] Task 6: Add "Forgot Password" link to LoginForm (AC: #1)
  - [x] Verify link exists (check current implementation)
  - [x] Ensure it navigates to `/auth/forgot-password`

- [x] Task 7: Write unit tests for ForgotPasswordForm
  - [x] Test email validation
  - [x] Test success message shown regardless of email
  - [x] Test loading state
  - [x] Test form elements render correctly

- [x] Task 8: Write unit tests for ResetPasswordForm
  - [x] Test password min length validation
  - [x] Test password confirmation match
  - [x] Test successful password update redirects
  - [x] Test expired token shows friendly error
  - [x] Test loading state

## Dev Notes

### Supabase Password Reset Flow

**Step 1: Request Reset**
```typescript
// ForgotPasswordForm
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});
```

**Step 2: User clicks email link**
Supabase redirects to: `/auth/reset-password?code=<token>`

**Step 3: Update Password**
```typescript
// ResetPasswordForm - Supabase automatically exchanges code for session
const { error } = await supabase.auth.updateUser({ password: newPassword });
```

### Critical Implementation Notes

**IMPORTANT: Supabase handles token exchange automatically**
- When user clicks email link with `code` param, Supabase JS client automatically exchanges it
- You do NOT need to manually call `exchangeCodeForSession`
- Just use `updateUser()` directly after the redirect

**Security: Never reveal email existence**
```typescript
// ALWAYS show this message, even if email not found
setSuccess("Check your email for reset instructions");
```

**Error Handling Pattern (from Story 1.4):**
```typescript
// Never expose raw Supabase errors
if (error) {
  if (error.message.includes('expired') || error.message.includes('invalid')) {
    setError('This reset link has expired. Please request a new one.');
    return;
  }
  setError('Unable to reset password. Please try again.');
  return;
}
```

### Architecture Compliance

**Server Action Response Shape (if creating server action):**
```typescript
type ActionResponse<T> = {
  data: T | null
  error: string | null
}
```

**Import Order (MANDATORY):**
```typescript
// 1. React/Next
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 2. External packages
// (none)

// 3. Internal @/ aliases
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 4. Relative imports
// (none)

// 5. Types (last)
// (none for this component)
```

**Component Props Pattern:**
```typescript
interface ForgotPasswordFormProps {
  className?: string;  // ALWAYS accept className
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  return (
    <Card className={cn("w-full max-w-md", className)}>
      {/* ... */}
    </Card>
  );
}
```

### Validation Constants

```typescript
// Reuse from login-form
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
```

### UX Theme Colors Reference

| Element | Token | Value |
|---------|-------|-------|
| Primary Button | primary | #1e3a5f |
| Button Hover | primary-light | #3d5a80 |
| Error Text | destructive | #e53e3e |
| Success Text | text-green-600 | Green success color |
| Background | background | #fafaf9 |
| Card Surface | surface | #ffffff |

### Project Structure Notes

**Files to Create:**
```
src/components/forgot-password-form.tsx
src/components/forgot-password-form.test.tsx
src/components/reset-password-form.tsx
src/components/reset-password-form.test.tsx
src/app/(auth)/forgot-password/page.tsx
src/app/(auth)/reset-password/page.tsx
```

**Files to Modify:**
```
src/app/auth/login/page.tsx (show success message)
src/components/login-form.tsx (verify forgot password link)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Server Action Response Shape]
- [Source: _bmad-output/project-context.md#Import Order]
- [Source: src/components/login-form.tsx - Email validation pattern]
- [Source: 1-4-user-login-logout.md - Error handling patterns]
- [Supabase Auth Docs: Password Reset](https://supabase.com/docs/guides/auth/passwords#resetting-a-password)

### Previous Story Intelligence

**From Story 1.4 (User Login & Logout):**
- Email validation regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- MIN_PASSWORD_LENGTH = 6
- Error handling pattern: never expose raw Supabase errors
- Import order violations caught in code review - follow strictly
- useTransition pattern for server action calls
- Suspense boundary required for useSearchParams (Next.js 16)
- Open redirect vulnerability fixed with `isValidRedirectUrl()` - consider for any redirects

**From Story 1.3 (User Registration):**
- SignUpForm pattern established with client-side validation
- Password minimum validation pattern

**From Story 1.2 (Database Schema & RLS):**
- Supabase client separation (client.ts for browser, server.ts for server)

**From Story 1.1 (Project Initialization):**
- Next.js 16.1.1 with React 19.2.3
- shadcn/ui components installed (Button, Card, Input, Label)
- Vitest configured for unit tests

### Git Intelligence

**Recent Commits:**
- `feat: Implement Stories 1-2 and 1-3 with code review fixes`
- `feat: Implement Story 1-4 User Login & Logout`

**Patterns Established:**
- Commit format: `feat:`, `fix:`
- Code review applied before merge
- ESLint + Vitest must pass

### Current Login Form Analysis

**Check current implementation for forgot password link:**
The starter template's login form should have a "Forgot Password" link. Verify it exists and points to the correct route.

If not present, add:
```tsx
<Link
  href="/auth/forgot-password"
  className="text-sm text-primary hover:underline"
>
  Forgot Password?
</Link>
```

### Testing Strategy

**ForgotPasswordForm Tests:**
```typescript
describe('ForgotPasswordForm', () => {
  it('renders email input and submit button', () => {});
  it('validates email format before submission', () => {});
  it('shows success message after submission', () => {});
  it('shows loading state during submission', () => {});
  it('accepts className prop', () => {});
});
```

**ResetPasswordForm Tests:**
```typescript
describe('ResetPasswordForm', () => {
  it('renders password and confirm password inputs', () => {});
  it('validates password minimum length', () => {});
  it('validates passwords match', () => {});
  it('shows error for expired token', () => {});
  it('redirects on successful password update', () => {});
  it('shows loading state during submission', () => {});
  it('accepts className prop', () => {});
});
```

### Anti-Patterns to Avoid

- ❌ Do NOT reveal if email exists in system (security vulnerability)
- ❌ Do NOT expose raw Supabase error messages
- ❌ Do NOT use `any` type for error handling
- ❌ Do NOT forget loading states during submission
- ❌ Do NOT skip client-side validation
- ❌ Do NOT violate import order from project-context.md
- ❌ Do NOT forget Suspense boundary for useSearchParams
- ❌ Do NOT manually call exchangeCodeForSession (Supabase handles it)

### Validation Checklist

Before marking complete:
- [ ] "Forgot Password" link on login page navigates to /auth/forgot-password
- [ ] Forgot password form validates email format
- [ ] Success message shown regardless of email existence
- [ ] Reset email is sent for valid registered emails
- [ ] Reset link navigates to /auth/reset-password with code param
- [ ] New password validates minimum 6 characters
- [ ] Password confirmation must match
- [ ] Successful reset redirects to login with success message
- [ ] Expired token shows friendly error with option to request new link
- [ ] Unit tests pass for ForgotPasswordForm
- [ ] Unit tests pass for ResetPasswordForm
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation with no debugging required.

### Completion Notes List

- ✅ Updated ForgotPasswordForm with email validation, secure error handling, correct redirect URL (/auth/reset-password)
- ✅ Created ResetPasswordForm with password validation, confirm password match, expired token handling
- ✅ Created /auth/reset-password page with Suspense boundary for Next.js 16 compatibility
- ✅ Updated LoginForm to show success message on password reset completion with auto-clear after 5s
- ✅ Verified "Forgot Password" link already exists and points to correct route
- ✅ All unit tests written following red-green-refactor cycle (25 new tests)
- ✅ All 76 tests pass, lint passes, build passes

### Code Review Fixes Applied

- ✅ CRITICAL-1: Fixed ForgotPasswordForm props pattern to use proper interface instead of `React.ComponentPropsWithoutRef<"div">`
- ✅ CRITICAL-2: Added session validation on mount in ResetPasswordForm to detect invalid/missing reset tokens immediately
- ✅ MEDIUM-1: Fixed import order in ResetPasswordForm (interface placement)
- ✅ MEDIUM-3: Added auto-clear timeout test for LoginForm success message
- ✅ LOW-1: Standardized error message styling to use `<p>` consistently across forms
- ✅ Added 4 additional tests: 3 for invalid session detection, 1 for auto-clear timeout

### File List

**New Files (created from scratch):**
- src/components/reset-password-form.tsx - Password reset form with validation and session check
- src/components/reset-password-form.test.tsx - 13 unit tests for reset password functionality
- src/app/auth/reset-password/page.tsx - Reset password route page with Suspense boundary
- src/components/forgot-password-form.test.tsx - 11 unit tests for forgot password functionality

**Enhanced Files (existing starter template files modified):**
- src/components/forgot-password-form.tsx - Added email validation, secure error handling, correct redirect URL, proper props interface
- src/components/login-form.tsx - Added success message handling for password-updated with 5s auto-clear
- src/components/login-form.test.tsx - Added 4 tests (3 for success message, 1 for auto-clear timeout)

**Unchanged Files (verified existing, no modifications needed):**
- src/app/auth/forgot-password/page.tsx - Already existed with correct implementation

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Implemented password reset flow (Story 1.5) - All 8 tasks completed | Claude Opus 4.5 |
| 2025-12-29 | Code review fixes: props interface, session validation, error styling, test coverage | Claude Opus 4.5 (Code Review) |
