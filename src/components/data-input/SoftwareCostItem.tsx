'use client'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { SoftwareCost } from '@/types/overhead-costs'

interface SoftwareCostItemProps {
  software: SoftwareCost
  onUpdate: (updates: Partial<SoftwareCost>) => void
  onRemove: () => void
  disabled?: boolean
  className?: string
  error?: string
}

export function SoftwareCostItem({
  software,
  onUpdate,
  onRemove,
  disabled = false,
  className,
  error,
}: SoftwareCostItemProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Software name"
          value={software.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          disabled={disabled}
          className="flex-1"
          aria-label="Software name"
        />
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={software.monthlyCost || ''}
            onChange={(e) =>
              onUpdate({ monthlyCost: parseFloat(e.target.value) || 0 })
            }
            disabled={disabled}
            className="pl-7"
            aria-label="Monthly cost"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove software"
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
