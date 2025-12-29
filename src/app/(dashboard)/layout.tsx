"use client";

import { useState } from "react";

import { Header, CollapsiblePanel } from "@/components/layout";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onPanelToggle={() => setIsPanelOpen(!isPanelOpen)}
        isPanelOpen={isPanelOpen}
      />

      {/* Main content area */}
      <main
        className={cn(
          "pt-header transition-all duration-200",
          isPanelOpen ? "pr-panel" : "pr-0"
        )}
      >
        {children}
      </main>

      <CollapsiblePanel isOpen={isPanelOpen} />
    </div>
  );
}
