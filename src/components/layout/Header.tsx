import { PanelRightClose, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

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
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-header bg-surface border-b border-border",
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-md">
        {/* Logo / Product Name */}
        <div className="flex items-center gap-sm">
          <span className="text-h3 font-semibold text-primary">
            BFI CFO Bot
          </span>
        </div>

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
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
