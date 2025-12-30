# Story 1.2: Database Schema & RLS Foundation

Status: done

## Story

As a **user**,
I want **my data to be completely isolated from other users**,
So that **my financial information remains private and secure**.

## Acceptance Criteria

1. **Given** the Supabase project is connected
   **When** the database migrations run
   **Then** a `profiles` table exists linked to `auth.users`
   **And** the `profiles` table has RLS enabled
   **And** users can only read/write their own profile row
   **And** the RLS policy uses `auth.uid() = user_id` pattern
   **And** a test confirms cross-tenant data access is blocked

2. **Given** a user is authenticated
   **When** they query any user-scoped table
   **Then** they only receive their own data
   **And** queries for other user IDs return empty results

## Tasks / Subtasks

- [x] Task 1: Create profiles table migration (AC: #1)
  - [x] Create migration file `supabase/migrations/00001_create_profiles.sql`
  - [x] Define profiles table with id (uuid, references auth.users), email, full_name, agency_name, created_at, updated_at
  - [x] Add onboarding_complete boolean column (default false)
  - [x] Add agency profile fields from onboarding: agency_name, annual_revenue_range, employee_count, user_role, top_financial_question, monthly_overhead_estimate

- [x] Task 2: Enable RLS and create policies (AC: #1, #2)
  - [x] Enable RLS on profiles table: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`
  - [x] Create SELECT policy with `TO authenticated` and `(select auth.uid()) = id` pattern
  - [x] Create INSERT policy with `WITH CHECK ((select auth.uid()) = id)`
  - [x] Create UPDATE policy with `USING` and `WITH CHECK` clauses
  - [x] Create DELETE policy with `USING` clause
  - [x] Add index on id column (primary key handles this)

- [x] Task 3: Create trigger for auto-profile creation (AC: #1)
  - [x] Create function `handle_new_user()` to auto-create profile on signup
  - [x] Create trigger `on_auth_user_created` that fires AFTER INSERT on `auth.users`
  - [x] Function should copy email from auth.users to profiles

- [x] Task 4: Test RLS policies with Vitest (AC: #1, #2)
  - [x] Create test file `src/lib/supabase/rls.test.ts`
  - [x] Test that authenticated user can read their own profile
  - [x] Test that authenticated user can update their own profile
  - [x] Test that authenticated user CANNOT read another user's profile
  - [x] Test that unauthenticated requests return no data
  - [x] Test cross-tenant isolation explicitly

- [x] Task 5: Create Supabase type generation (AC: #1)
  - [x] Add script to package.json: `"db:types": "npx supabase gen types typescript --project-id <ref> > src/types/database.ts"`
  - [x] Document the process for regenerating types after schema changes
  - [x] Create initial `src/types/database.ts` with profiles table types

- [x] Task 6: Update Supabase client to use typed client (AC: #1)
  - [x] Import Database type in `src/lib/supabase/client.ts`
  - [x] Import Database type in `src/lib/supabase/server.ts`
  - [x] Import Database type in `src/lib/supabase/admin.ts`
  - [x] Verify TypeScript autocomplete works for profiles table

## Dev Notes

### Critical Architecture Patterns

**RLS Best Practices (2025):**
- Use `(select auth.uid())` instead of bare `auth.uid()` for better Postgres optimizer caching
- Always specify `TO authenticated` role - never rely solely on auth.uid() to exclude anon users
- Create SEPARATE policies for each operation (SELECT, INSERT, UPDATE, DELETE) - never use `FOR ALL`
- Add indexes on columns used in RLS policies (id is already the primary key)
- For UPDATE operations, a corresponding SELECT policy is required

**Database Naming Conventions:**
```sql
-- Tables: plural, snake_case
profiles, chat_messages, financial_documents

-- Columns: snake_case
user_id, created_at, is_active

-- Foreign keys: referenced_table_id
user_id (references users.id)
```

### Profiles Table Schema

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,

  -- Agency onboarding fields (FR4, FR5)
  agency_name TEXT,
  annual_revenue_range TEXT, -- dropdown value
  employee_count INTEGER,
  user_role TEXT, -- 'owner' | 'office_manager' | 'other'
  top_financial_question TEXT,
  monthly_overhead_estimate DECIMAL(12,2),

  -- Status flags
  onboarding_complete BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policy Pattern (Use This Exact Pattern)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- INSERT: Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- DELETE: Users can only delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING ((select auth.uid()) = id);
```

### Auto-Profile Creation Trigger

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Supabase Client Type Integration

```typescript
// src/types/database.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          agency_name: string | null
          // ... other fields
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          // ... other optional fields
        }
        Update: {
          full_name?: string | null
          agency_name?: string | null
          // ... updatable fields
        }
      }
    }
  }
}

// Usage in clients
import { Database } from '@/types/database'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Project Structure Notes

**Migration file location:**
```
supabase/
  migrations/
    00001_create_profiles.sql  <-- NEW
```

**Type file location:**
```
src/
  types/
    database.ts  <-- NEW (generated or manual)
    index.ts     <-- Export barrel
```

### Testing Strategy

**RLS Test Approach:**
1. Create two test users (User A and User B)
2. Insert profile for User A using User A's token
3. Query profiles using User A's token → should return User A's profile only
4. Query profiles using User B's token → should return empty (User B has no profile yet)
5. Attempt to update User A's profile using User B's token → should fail
6. Attempt to select User A's profile using User B's token → should return empty

**Test File Structure:**
```typescript
// src/lib/supabase/rls.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('RLS Policies', () => {
  describe('profiles table', () => {
    it('allows user to read their own profile', async () => {})
    it('blocks user from reading other profiles', async () => {})
    it('allows user to update their own profile', async () => {})
    it('blocks user from updating other profiles', async () => {})
    it('returns empty for unauthenticated requests', async () => {})
  })
})
```

### Previous Story Intelligence

**From Story 1.1 (Project Initialization):**
- Project uses Next.js 16.1.1 with src/ directory structure
- Supabase clients already set up in `src/lib/supabase/` (client.ts, server.ts, admin.ts)
- Environment variables configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vitest already configured with 3 passing tests
- TypeScript strict mode enabled
- All dependencies pinned

**Learnings to Apply:**
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not PUBLISHABLE_KEY) - fixed in Story 1.1
- Supabase config.toml already exists in `supabase/` directory
- Migrations folder exists with `.gitkeep`

### Git Intelligence

**Recent Commits:**
- `a4cd5ee` - feat: Project initialization with code review fixes and restructuring
- `10ae84d` - Initial commit from Create Next App

**Patterns Established:**
- Commit message format: `feat:`, `fix:`, etc.
- Code review applied before merge
- ESLint passing required

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/project-context.md#Security Rules]
- [Source: Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Source: Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

### Environment Variables Required

```bash
# Already configured from Story 1.1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Needed for admin operations (testing RLS, type generation)
SUPABASE_SERVICE_ROLE_KEY=
```

### Anti-Patterns to Avoid

- Do NOT use `FOR ALL` in RLS policies - create separate policies for each operation
- Do NOT use bare `auth.uid()` - wrap in `(select auth.uid())` for performance
- Do NOT skip `TO authenticated` role specification
- Do NOT create tables without RLS enabled
- Do NOT expose SUPABASE_SERVICE_ROLE_KEY to client code
- Do NOT rely on application-level security - RLS is the source of truth

### Validation Checklist

Before marking complete:
- [x] Migration file exists and is syntactically valid SQL
- [x] `npx supabase db push` succeeds (or migration applies via dashboard)
- [x] profiles table visible in Supabase dashboard with RLS enabled
- [x] All 4 RLS policies visible in dashboard (SELECT, INSERT, UPDATE, DELETE)
- [x] Trigger `on_auth_user_created` visible in dashboard
- [x] Type file `src/types/database.ts` exists
- [x] Supabase clients use typed Database generic
- [x] RLS tests pass (all 5+ test cases)
- [x] Cross-tenant access is blocked (verified by test)
- [x] `npm run build` passes
- [x] `npm run lint` passes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Linked Supabase project pmtvlokatbkavujwcdij (BFI)
- Fixed config.toml to remove deprecated [project] section
- Updated Postgres major_version from 15 to 17

### Completion Notes List

- Created comprehensive profiles table migration with all agency onboarding fields
- Implemented 4 separate RLS policies (SELECT, INSERT, UPDATE, DELETE) using `(select auth.uid())` pattern
- Added auto-profile creation trigger that fires on auth.users INSERT
- Added updated_at trigger for automatic timestamp updates
- Generated TypeScript types using Supabase CLI
- Updated all 3 Supabase clients (client.ts, server.ts, admin.ts) with Database generic
- Added `db:types` npm script for regenerating types
- Created comprehensive RLS test suite with 9 test cases covering unauthenticated access and cross-tenant isolation
- Updated vitest.config.ts to load environment variables from .env.local
- All 12 tests passing (3 existing + 9 new RLS tests)
- Build and lint passing

### Change Log

- 2025-12-29: Implemented database schema, RLS policies, triggers, type generation, and comprehensive test coverage
- 2025-12-29: [CODE-REVIEW] Fixed 8 issues: Added NOT NULL constraints to schema, added DELETE test cases, updated .gitignore, cleaned up stale folder, updated project-context with RLS best practices

### File List

- supabase/migrations/00001_create_profiles.sql (NEW)
- supabase/migrations/00002_add_not_null_constraints.sql (NEW - code review fix)
- src/types/database.ts (NEW)
- src/lib/supabase/rls.test.ts (NEW, REVIEW-UPDATED: added DELETE test cases)
- src/lib/supabase/client.ts (MODIFIED - added Database type)
- src/lib/supabase/server.ts (MODIFIED - added Database type)
- src/lib/supabase/admin.ts (MODIFIED - added Database type)
- package.json (MODIFIED - added db:types script, dotenv devDep)
- package-lock.json (MODIFIED - lockfile updated)
- vitest.config.ts (MODIFIED - added env loading)
- supabase/config.toml (MODIFIED - removed [project], updated major_version)
- eslint.config.mjs (MODIFIED - added bfi-cfo-bot to ignores)
- .gitignore (REVIEW-UPDATED: added supabase/.temp/)
- .env.local (MODIFIED - added SUPABASE_SERVICE_ROLE_KEY)
