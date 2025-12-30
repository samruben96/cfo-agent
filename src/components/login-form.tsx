"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Email validation regex (from Story 1.3 pattern)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimum password length (matches Supabase default)
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validates that a redirect URL is safe (internal path only).
 * Prevents open redirect attacks.
 */
function isValidRedirectUrl(url: string): boolean {
  // Must start with / and not contain protocol or double slashes
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  // Block javascript: and other protocol handlers
  if (url.toLowerCase().includes("javascript:")) return false;
  return true;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side email validation
    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Client-side password length validation
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Map Supabase errors to friendly messages - never expose raw errors
        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password");
          return;
        }
        // Generic fallback for any other auth error
        setError("Unable to sign in. Please try again.");
        return;
      }

      // Get redirectTo from URL or default to /chat
      // Validate to prevent open redirect attacks
      const requestedRedirect = searchParams.get("redirectTo");
      const redirectTo =
        requestedRedirect && isValidRedirectUrl(requestedRedirect)
          ? requestedRedirect
          : "/chat";
      router.push(redirectTo);
    } catch {
      // Unexpected errors - never expose details
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>
            Enter your email below to log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
