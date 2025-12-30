import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/reset-password-form";

function ResetPasswordFormFallback() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="animate-pulse rounded-lg border bg-card p-6">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-36 bg-muted rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ResetPasswordFormFallback />}>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ResetPasswordForm />
        </div>
      </div>
    </Suspense>
  );
}
