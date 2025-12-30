'use client'

import { useRouter } from 'next/navigation'

import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { WindowWithNavHandler } from '@/types/navigation'

interface BackToChatLinkProps {
  className?: string
}

export function BackToChatLink({ className }: BackToChatLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const windowWithHandler = window as WindowWithNavHandler

    if (windowWithHandler.__handleSettingsNavigation) {
      windowWithHandler.__handleSettingsNavigation('/chat')
    } else {
      router.push('/chat')
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-xs text-sm text-muted-foreground hover:text-foreground transition-colors mb-lg",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Chat
    </button>
  )
}
