import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format, isValid } from 'date-fns'

/**
 * Format a date string to a relative format for display in conversation list
 * - "Today" → "2 hours ago"
 * - "Yesterday" → "Yesterday"
 * - This week → Day name (e.g., "Monday")
 * - Older → "Dec 28"
 * - Invalid → "Unknown"
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString)

    // Check for invalid dates
    if (!isValid(date)) {
      return 'Unknown'
    }

    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    if (isThisWeek(date)) {
      return format(date, 'EEEE') // Day name
    }
    return format(date, 'MMM d') // "Dec 28"
  } catch {
    return 'Unknown'
  }
}

/**
 * Get the date group for a conversation (for grouping)
 * Returns: 'Today' | 'Yesterday' | 'This Week' | 'Older'
 */
export function getDateGroup(dateString: string): string {
  try {
    const date = new Date(dateString)

    // Check for invalid dates - default to 'Older' group
    if (!isValid(date)) {
      return 'Older'
    }

    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return 'This Week'
    return 'Older'
  } catch {
    return 'Older'
  }
}
