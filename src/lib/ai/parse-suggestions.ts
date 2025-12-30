const SUGGESTIONS_DELIMITER = '---SUGGESTIONS---'
const MAX_SUGGESTIONS = 3
const MAX_SUGGESTION_LENGTH = 100

/**
 * Parses suggested follow-up questions from an AI response.
 * Expects suggestions to be formatted after the delimiter:
 *
 * ---SUGGESTIONS---
 * - First question?
 * - Second question?
 * - Third question?
 *
 * @param response - The full AI response text
 * @returns Array of 0-3 suggestion strings, empty if no valid suggestions found
 */
export function parseSuggestions(response: string): string[] {
  const parts = response.split(SUGGESTIONS_DELIMITER)

  // No delimiter found
  if (parts.length < 2) {
    return []
  }

  const suggestionsSection = parts[1].trim()

  // Empty suggestions section
  if (!suggestionsSection) {
    return []
  }

  const suggestions = suggestionsSection
    .split('\n')
    // Remove bullet point markers (-, *, •) and trim
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    // Filter out empty lines
    .filter((line) => line.length > 0)
    // Filter out lines that are too long
    .filter((line) => line.length <= MAX_SUGGESTION_LENGTH)
    // Limit to max suggestions
    .slice(0, MAX_SUGGESTIONS)

  return suggestions
}

/**
 * Removes the suggestions section from an AI response, returning only the main content.
 *
 * @param response - The full AI response text
 * @returns The response text without the suggestions section
 */
export function getCleanResponse(response: string): string {
  const parts = response.split(SUGGESTIONS_DELIMITER)
  return parts[0].trim()
}
