import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  isOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CollapsiblePanel({
  isOpen = false,
  className,
  children,
}: CollapsiblePanelProps) {
  return (
    <aside
      className={cn(
        "fixed top-header right-0 bottom-0 w-panel bg-surface border-l border-border",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}
    >
      <div className="p-md h-full overflow-y-auto">
        {children || (
          <div className="text-muted-foreground text-body-sm">
            Panel content placeholder
          </div>
        )}
      </div>
    </aside>
  );
}
