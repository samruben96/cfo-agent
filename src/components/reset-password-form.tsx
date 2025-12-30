"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

// Minimum password length (matches Supabase default and Story 1.4 pattern)
const MIN_PASSWORD_LENGTH = 6;

interface ResetPasswordFormProps {
  className?: string;
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpiredToken, setIsExpiredToken] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const router = useRouter();

  // Check for valid session on mount (Supabase exchanges code automatically)
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      if (!session) {
        setError("This reset link is invalid or has expired. Please request a new one.");
        setIsExpiredToken(true);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsExpiredToken(false);

    // Client-side password length validation
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      // Supabase automatically exchanges the code from URL for a session
      // We just need to call updateUser with the new password
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) {
        // Check for expired/invalid token
        if (
          authError.message.includes("expired") ||
          authError.message.includes("invalid")
        ) {
          setError("This reset link has expired. Please request a new one.");
          setIsExpiredToken(true);
          return;
        }
        // Generic error for other cases
        setError("Unable to reset password. Please try again.");
        return;
      }

      // Redirect to login with success message
      router.push("/auth/login?message=password-updated");
    } catch {
      setError("Unable to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">
                  {error}
                  {isExpiredToken && (
                    <>
                      {" "}
                      <Link
                        href="/auth/forgot-password"
                        className="underline underline-offset-4 hover:text-destructive/90"
                      >
                        Request a new link
                      </Link>
                    </>
                  )}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isValidSession === false}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
