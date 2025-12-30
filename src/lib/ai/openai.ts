import { createOpenAI } from '@ai-sdk/openai'

// Validate API key exists at module load time (fails fast in development)
if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('[OpenAI] OPENAI_API_KEY is not configured - chat functionality will not work')
}

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
