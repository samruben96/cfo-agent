"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelRightClose, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

import type { WindowWithNavHandler } from "@/types/navigation";

interface HeaderProps {
  onPanelToggle?: () => void;
  isPanelOpen?: boolean;
  className?: string;
}

export function Header({
  onPanelToggle,
  isPanelOpen = false,
  className,
}: HeaderProps) {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const windowWithHandler = window as WindowWithNavHandler;

    if (windowWithHandler.__handleSettingsNavigation) {
      windowWithHandler.__handleSettingsNavigation("/chat");
    } else {
      router.push("/chat");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-header bg-surface border-b border-border",
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-md">
        {/* Logo / Product Name */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-sm hover:opacity-80 transition-opacity"
        >
          <span className="text-h3 font-semibold text-primary">
            BFI CFO Bot
          </span>
        </button>

        {/* Icon Buttons */}
        <div className="flex items-center gap-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPanelToggle}
            aria-label={isPanelOpen ? "Close panel" : "Open panel"}
          >
            <PanelRightClose
              className={cn(
                "h-5 w-5 transition-transform",
                isPanelOpen && "rotate-180"
              )}
            />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
