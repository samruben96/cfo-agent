import { describe, it, expect } from 'vitest'

import { createCFOSystemPrompt } from './prompts'

describe('createCFOSystemPrompt', () => {
  const mockContext = {
    agencyName: 'ABC Insurance',
    employeeCount: 10,
    revenueRange: '$1M - $5M',
  }

  describe('basic prompt generation', () => {
    it('includes agency name in the prompt', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('ABC Insurance')
    })

    it('includes employee count in the prompt', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('10')
    })

    it('includes revenue range in the prompt', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('$1M - $5M')
    })

    it('handles null agency name gracefully', () => {
      const prompt = createCFOSystemPrompt({
        ...mockContext,
        agencyName: null,
      })
      expect(prompt).toContain('an insurance agency')
      expect(prompt).toContain('Not provided')
    })

    it('handles null employee count gracefully', () => {
      const prompt = createCFOSystemPrompt({
        ...mockContext,
        employeeCount: null,
      })
      expect(prompt).toContain('Employee Count: Not provided')
    })

    it('handles null revenue range gracefully', () => {
      const prompt = createCFOSystemPrompt({
        ...mockContext,
        revenueRange: null,
      })
      expect(prompt).toContain('Annual Revenue Range: Not provided')
    })
  })

  describe('conversational context handling', () => {
    it('includes pronoun resolution instructions', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/pronoun/i)
      expect(prompt).toMatch(/("that"|"this"|"it")/i)
    })

    it('includes implicit reference handling instructions', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/breakdown|details/i)
      expect(prompt).toMatch(/previous|recent/i)
    })

    it('includes topic switching guidance', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/topic.*switch|switch.*topic/i)
    })

    it('includes clarification question guidance', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/clarif/i)
      expect(prompt).toMatch(/ambiguous/i)
    })

    it('includes context resolution examples', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      // Should have examples showing pronoun resolution
      expect(prompt).toMatch(/example/i)
    })

    it('includes instruction to remember numbers and calculations', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/remember.*numbers|numbers.*remember/i)
      expect(prompt).toMatch(/calculations/i)
    })
  })

  describe('prompt structure', () => {
    it('defines the AI role clearly', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('CFO assistant')
    })

    it('includes guidelines section', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('Guidelines')
    })

    it('maintains conversational tone instruction', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/conversational|plain English/i)
    })
  })

  describe('data collection guidelines', () => {
    it('includes data collection guidelines section', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('Data Collection Guidelines')
    })

    it('instructs AI to use tools for saving data', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/use your tools to save/i)
    })

    it('includes confirmation message pattern', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain("Got it, I've updated")
    })

    it('includes updateRent tool usage example', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('updateRent')
    })

    it('includes updateEmployeeCount tool usage example', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('updateEmployeeCount')
    })

    it('includes updateSoftwareSpend tool usage example', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('updateSoftwareSpend')
    })

    it('instructs AI to ask for missing data proactively', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/proactive.*missing data|ask.*missing/i)
    })
  })

  describe('follow-up question suggestions', () => {
    it('includes follow-up question guidelines section', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('Follow-up Question Guidelines')
    })

    it('instructs AI to include 2-3 suggestions at end of responses', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/2-3.*suggested.*follow-up|suggested.*2-3/i)
    })

    it('specifies the SUGGESTIONS delimiter format', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('---SUGGESTIONS---')
    })

    it('instructs suggestions to be contextually relevant', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toMatch(/relevant.*discussed|discussed.*relevant/i)
    })

    it('includes example suggestions for employee costs context', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('profitability by role')
    })

    it('includes example suggestions for overhead context', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('break down')
    })

    it('provides bullet format example for suggestions', () => {
      const prompt = createCFOSystemPrompt(mockContext)
      expect(prompt).toContain('- [First follow-up question]')
    })
  })
})
