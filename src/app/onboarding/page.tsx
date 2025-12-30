// 1. React/Next imports
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

// 3. Internal aliases (@/)
import { createClient } from "@/lib/supabase/server";

async function OnboardingContent() {
  // Ensure user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Placeholder page - Epic 2 will implement full onboarding flow
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Welcome to BFI CFO Bot!
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your account has been created successfully.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        The onboarding flow will be available in Epic 2.
      </p>
      <div className="mt-8">
        <Link
          href="/chat"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Go to Chat
        </Link>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading...</div>
        }
      >
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
