import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { type EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code"); // PKCE flow uses code
  // Check both 'next' (legacy) and 'redirect' params, default to onboarding for new users
  const next =
    searchParams.get("next") ||
    searchParams.get("redirect") ||
    "/onboarding";

  const supabase = await createClient();

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Handle traditional OTP/magic link flow (token_hash-based)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If user is already authenticated (PKCE completed on Supabase side), just redirect
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }

  // No valid auth method found
  redirect(`/auth/error?error=${encodeURIComponent("No valid authentication token")}`);
}
