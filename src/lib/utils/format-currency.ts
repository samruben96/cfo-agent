/**
 * Currency formatting utilities.
 */

/**
 * Currency formatting options.
 */
export const CURRENCY_FORMAT_OPTIONS = {
  maximumFractionDigits: 0,
} as const

/**
 * Formats a number as US currency (e.g., $65,000).
 * @param value - The numeric value to format
 * @returns Formatted currency string with $ prefix and comma separators
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', CURRENCY_FORMAT_OPTIONS)}`
}
