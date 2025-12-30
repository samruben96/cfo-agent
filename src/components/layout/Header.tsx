"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Database, PanelRightClose, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const pathname = usePathname();

  const isDataRoute = pathname?.startsWith("/data");

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const windowWithHandler = window as WindowWithNavHandler;

    if (windowWithHandler.__handleSettingsNavigation) {
      windowWithHandler.__handleSettingsNavigation("/chat");
    } else {
      router.push("/chat");
    }
  };

  const handleDataNavigation = (href: string) => {
    const windowWithHandler = window as WindowWithNavHandler;

    if (windowWithHandler.__handleSettingsNavigation) {
      windowWithHandler.__handleSettingsNavigation(href);
    } else {
      router.push(href);
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

        {/* Navigation and Icon Buttons */}
        <div className="flex items-center gap-xs">
          {/* Data Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5",
                  isDataRoute && "bg-accent text-accent-foreground"
                )}
                aria-label="Data menu"
              >
                <Database className="h-4 w-4" />
                Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDataNavigation("/data/overhead")}
                className={cn(
                  pathname === "/data/overhead" && "bg-accent"
                )}
              >
                Overhead Costs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDataNavigation("/data/employees")}
                className={cn(
                  pathname === "/data/employees" && "bg-accent"
                )}
              >
                Employees
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
