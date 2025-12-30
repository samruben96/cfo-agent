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

      {/* Main content area - starts after fixed header (56px) */}
      <main
        className={cn(
          "fixed top-14 left-0 right-0 bottom-0 overflow-hidden transition-all duration-200",
          isPanelOpen ? "right-[280px]" : "right-0"
        )}
      >
        {children}
      </main>

      <CollapsiblePanel isOpen={isPanelOpen} />
    </div>
  );
}
