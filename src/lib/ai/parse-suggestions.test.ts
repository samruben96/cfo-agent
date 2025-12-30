import { describe, it, expect } from 'vitest'

import { parseSuggestions, getCleanResponse } from './parse-suggestions'

describe('parseSuggestions', () => {
  it('extracts suggestions from response with delimiter', () => {
    const response = `Here's your employee cost breakdown...

The total is $50,000 per month.

---SUGGESTIONS---
- How does this compare to industry benchmarks?
- Can I afford to hire another CSR?
- Show me the breakdown by department`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([
      'How does this compare to industry benchmarks?',
      'Can I afford to hire another CSR?',
      'Show me the breakdown by department'
    ])
  })

  it('returns empty array when no suggestions delimiter present', () => {
    const response = 'Here is your financial analysis.'

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([])
  })

  it('handles 2 suggestions correctly', () => {
    const response = `Your payroll ratio is 45%.

---SUGGESTIONS---
- How does this compare to benchmarks?
- What can I do to improve it?`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toHaveLength(2)
    expect(suggestions[0]).toBe('How does this compare to benchmarks?')
    expect(suggestions[1]).toBe('What can I do to improve it?')
  })

  it('limits suggestions to 3 maximum', () => {
    const response = `Response text.

---SUGGESTIONS---
- Question 1?
- Question 2?
- Question 3?
- Question 4?
- Question 5?`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toHaveLength(3)
  })

  it('strips bullet point markers from suggestions', () => {
    const response = `Response.

---SUGGESTIONS---
- First question?
* Second question?
• Third question?`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([
      'First question?',
      'Second question?',
      'Third question?'
    ])
  })

  it('trims whitespace from suggestions', () => {
    const response = `Response.

---SUGGESTIONS---
-   Spaced question?
-    Another one   `

    const suggestions = parseSuggestions(response)

    expect(suggestions[0]).toBe('Spaced question?')
    expect(suggestions[1]).toBe('Another one')
  })

  it('filters out empty lines in suggestions section', () => {
    const response = `Response.

---SUGGESTIONS---
- First question?

- Second question?

`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([
      'First question?',
      'Second question?'
    ])
  })

  it('filters out suggestions that exceed 100 characters', () => {
    const longQuestion = 'This is a very long question that exceeds one hundred characters which should be filtered out because it is too verbose and unhelpful'
    const response = `Response.

---SUGGESTIONS---
- ${longQuestion}
- Short question?
- Normal question?`

    const suggestions = parseSuggestions(response)

    expect(suggestions).not.toContain(longQuestion)
    expect(suggestions).toContain('Short question?')
    expect(suggestions).toContain('Normal question?')
  })

  it('handles malformed input gracefully', () => {
    const response = '---SUGGESTIONS---'

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([])
  })

  it('handles delimiter with no content after', () => {
    const response = `Response text.

---SUGGESTIONS---`

    const suggestions = parseSuggestions(response)

    expect(suggestions).toEqual([])
  })
})

describe('getCleanResponse', () => {
  it('removes suggestions section from response', () => {
    const response = `Here's your employee cost breakdown.

The total is $50,000.

---SUGGESTIONS---
- Question 1?
- Question 2?`

    const clean = getCleanResponse(response)

    expect(clean).toBe(`Here's your employee cost breakdown.

The total is $50,000.`)
    expect(clean).not.toContain('---SUGGESTIONS---')
    expect(clean).not.toContain('Question 1?')
  })

  it('returns original response when no suggestions delimiter', () => {
    const response = 'Here is your financial analysis.'

    const clean = getCleanResponse(response)

    expect(clean).toBe('Here is your financial analysis.')
  })

  it('trims whitespace after removing suggestions', () => {
    const response = `Response text.

---SUGGESTIONS---
- Question?`

    const clean = getCleanResponse(response)

    expect(clean).toBe('Response text.')
    expect(clean).not.toMatch(/\s+$/)
  })

  it('handles response that is only the delimiter', () => {
    const response = '---SUGGESTIONS---'

    const clean = getCleanResponse(response)

    expect(clean).toBe('')
  })
})
