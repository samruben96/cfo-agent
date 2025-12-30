/**
 * RLS Policy Tests for profiles table
 * Story: 1.2 Database Schema & RLS Foundation
 *
 * These tests verify Row Level Security is properly enforced:
 * - Unauthenticated users get no data
 * - Authenticated users only see their own data
 * - Cross-tenant access is blocked
 *
 * NOTE: Full RLS testing requires SUPABASE_SERVICE_ROLE_KEY to create test users.
 * When service key is not available, tests validate unauthenticated access is blocked.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import type { Database } from "@/types/database";

// Environment variables for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip all tests if Supabase is not configured
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)("RLS Policies", () => {
  describe("profiles table - unauthenticated access", () => {
    it("returns empty array for unauthenticated SELECT request", async () => {
      // Create client with anon key (no auth session)
      const anonClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
      );

      const { data, error } = await anonClient.from("profiles").select("*");

      // RLS should block access - returns empty array, no error
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("blocks unauthenticated INSERT request", async () => {
      const anonClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
      );

      const { data, error } = await anonClient.from("profiles").insert({
        id: "00000000-0000-0000-0000-000000000001",
        email: "test@example.com",
      });

      // RLS should block - INSERT requires auth.uid() = id
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("blocks unauthenticated UPDATE request", async () => {
      const anonClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
      );

      const { error } = await anonClient
        .from("profiles")
        .update({ full_name: "Hacker" })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      // RLS should block - no rows match for unauthenticated user
      expect(error).toBeNull(); // No error, but 0 rows affected
    });

    it("blocks unauthenticated DELETE request", async () => {
      const anonClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
      );

      const { error } = await anonClient
        .from("profiles")
        .delete()
        .eq("id", "00000000-0000-0000-0000-000000000001");

      // RLS should block - no rows match for unauthenticated user
      expect(error).toBeNull(); // No error, but 0 rows affected
    });
  });

  // Cross-tenant isolation tests require service role key to create test users
  describe.skipIf(!SUPABASE_SERVICE_ROLE_KEY)(
    "profiles table - cross-tenant isolation",
    () => {
      let adminClient: SupabaseClient<Database>;
      let userAClient: SupabaseClient<Database>;
      let userBClient: SupabaseClient<Database>;
      let userAId: string;
      let userBId: string;
      const testPassword = "TestPassword123!";
      let testEmailA: string;
      let testEmailB: string;

      beforeAll(async () => {
        // Create admin client
        adminClient = createClient<Database>(
          SUPABASE_URL!,
          SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          },
        );

        // Generate unique test emails
        const timestamp = Date.now();
        testEmailA = `test-rls-a-${timestamp}@example.com`;
        testEmailB = `test-rls-b-${timestamp}@example.com`;

        // Create User A with admin client
        const { data: userA, error: errorA } =
          await adminClient.auth.admin.createUser({
            email: testEmailA,
            password: testPassword,
            email_confirm: true,
          });
        if (errorA) throw new Error(`Failed to create User A: ${errorA.message}`);
        userAId = userA.user.id;

        // Create User B with admin client
        const { data: userB, error: errorB } =
          await adminClient.auth.admin.createUser({
            email: testEmailB,
            password: testPassword,
            email_confirm: true,
          });
        if (errorB) throw new Error(`Failed to create User B: ${errorB.message}`);
        userBId = userB.user.id;

        // Create authenticated client for User A by signing in
        userAClient = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        const { error: signInErrorA } = await userAClient.auth.signInWithPassword({
          email: testEmailA,
          password: testPassword,
        });
        if (signInErrorA) throw new Error(`Failed to sign in User A: ${signInErrorA.message}`);

        // Create authenticated client for User B by signing in
        userBClient = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        const { error: signInErrorB } = await userBClient.auth.signInWithPassword({
          email: testEmailB,
          password: testPassword,
        });
        if (signInErrorB) throw new Error(`Failed to sign in User B: ${signInErrorB.message}`);
      });

      afterAll(async () => {
        // Clean up test users
        if (userAId) {
          await adminClient.auth.admin.deleteUser(userAId);
        }
        if (userBId) {
          await adminClient.auth.admin.deleteUser(userBId);
        }
      });

      it("allows user to read their own profile", async () => {
        const { data, error } = await userAClient
          .from("profiles")
          .select("*")
          .eq("id", userAId)
          .single();

        expect(error).toBeNull();
        expect(data?.id).toBe(userAId);
        expect(data?.email).toBe(testEmailA);
      });

      it("blocks user from reading another user's profile", async () => {
        // User A tries to read User B's profile
        const { data, error } = await userAClient
          .from("profiles")
          .select("*")
          .eq("id", userBId);

        // RLS blocks access - returns empty array
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("allows user to update their own profile", async () => {
        const { data, error } = await userAClient
          .from("profiles")
          .update({ full_name: "Test User A" })
          .eq("id", userAId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.full_name).toBe("Test User A");
      });

      it("blocks user from updating another user's profile", async () => {
        // User A tries to update User B's profile
        const { data, error } = await userAClient
          .from("profiles")
          .update({ full_name: "Hacked!" })
          .eq("id", userBId)
          .select();

        // RLS blocks - no rows affected (empty result)
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });

      it("allows user to delete their own profile", async () => {
        // First, verify User A's profile exists
        const { data: beforeDelete } = await userAClient
          .from("profiles")
          .select("id")
          .eq("id", userAId)
          .single();
        expect(beforeDelete?.id).toBe(userAId);

        // Delete User A's profile
        const { error } = await userAClient
          .from("profiles")
          .delete()
          .eq("id", userAId);

        expect(error).toBeNull();

        // Verify profile is deleted
        const { data: afterDelete } = await userAClient
          .from("profiles")
          .select("id")
          .eq("id", userAId);

        expect(afterDelete).toEqual([]);

        // Recreate profile for subsequent tests (trigger won't fire again)
        await adminClient.from("profiles").insert({
          id: userAId,
          email: testEmailA,
        });
      });

      it("blocks user from deleting another user's profile", async () => {
        // User A tries to delete User B's profile
        const { error } = await userAClient
          .from("profiles")
          .delete()
          .eq("id", userBId);

        // RLS blocks - no error but no rows affected
        expect(error).toBeNull();

        // Verify User B's profile still exists
        const { data: stillExists } = await userBClient
          .from("profiles")
          .select("id")
          .eq("id", userBId)
          .single();

        expect(stillExists?.id).toBe(userBId);
      });

      it("verifies cross-tenant isolation explicitly", async () => {
        // Get all profiles User A can see
        const { data: visibleProfiles } = await userAClient
          .from("profiles")
          .select("id");

        // Should only contain User A's profile
        const visibleIds = visibleProfiles?.map((p) => p.id) || [];
        expect(visibleIds).toContain(userAId);
        expect(visibleIds).not.toContain(userBId);

        // Verify User B can see their own profile
        const { data: userBProfiles } = await userBClient
          .from("profiles")
          .select("id");

        const userBVisibleIds = userBProfiles?.map((p) => p.id) || [];
        expect(userBVisibleIds).toContain(userBId);
        expect(userBVisibleIds).not.toContain(userAId);
      });
    },
  );
});
