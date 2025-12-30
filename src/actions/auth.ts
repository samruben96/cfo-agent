"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { ActionResponse } from "@/types";

/**
 * Signs the user out and redirects to the login page.
 * Uses Server Action pattern for secure server-side logout.
 * Returns error response if signOut fails, otherwise redirects.
 */
export async function logout(): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AuthAction]", { action: "logout", error: error.message });
      return { data: null, error: "Unable to sign out. Please try again." };
    }
  } catch (e) {
    console.error("[AuthAction]", {
      action: "logout",
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return { data: null, error: "Unable to sign out. Please try again." };
  }

  // Only redirect after successful signOut
  redirect("/auth/login");
}
