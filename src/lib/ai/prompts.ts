/**
 * Configuration constants for prompt generation
 */
export const PROMPT_CONFIG = {
  /**
   * Maximum characters of extracted data to include in prompt
   * Set to 32,000 chars (~8,000 tokens) to accommodate larger financial documents
   * while leaving ample room for system prompt and conversation history.
   * Note: Future RAG implementation (Epic 7) will enable cross-document search
   * with intelligent chunking and retrieval.
   */
  MAX_EXTRACTED_DATA_CHARS: 32000,
} as const

export interface AgencyContext {
  agencyName: string | null
  employeeCount: number | null
  revenueRange: string | null
  /** Document context for "Chat about this" flow - AC #15 */
  documentContext?: DocumentContext | null
  /** Multiple document contexts for multi-select reference */
  documentContexts?: DocumentContext[]
  /** Whether this is an error resolution session - AC #17, #18 */
  isErrorResolution?: boolean
  /** Error message from failed document processing */
  errorMessage?: string | null
}

export interface DocumentContext {
  filename: string
  fileType: 'csv' | 'pdf'
  documentType: string // e.g., 'pl', 'payroll', 'expense', 'employees'
  extractedData: Record<string, unknown> | null
  /** Whether the document is still processing - AC #11 */
  isProcessing?: boolean
  summary?: {
    title: string
    metrics: Array<{ label: string; value: string }>
    itemCount?: number
    dateRange?: { start: string; end: string }
  }
}

/**
 * Build document context section for system prompt - AC #15
 * Provides AI with document data for "Chat about this" conversations
 */
function buildDocumentContextSection(doc: DocumentContext): string {
  const typeLabels: Record<string, string> = {
    pl: 'P&L Statement',
    payroll: 'Payroll Report',
    expense: 'Expense Report',
    employees: 'Employee Data',
    csv: 'CSV Data',
    pdf: 'PDF Document',
  }

  const docTypeName = typeLabels[doc.documentType] || 'Document'

  // Handle processing documents - AC #11
  if (doc.isProcessing) {
    return `\nDocument Still Processing:
The user uploaded "${doc.filename}" (${docTypeName}) but it is still being processed.

IMPORTANT - AC #11:
- If the user asks about this document, respond: "I'm still processing your ${docTypeName}. Give me just a moment to finish extracting the data, and I'll be able to answer your questions about it."
- Let them know you'll be able to help once processing completes
- You can offer to help with other questions while they wait
- Do NOT make up data about a document that's still processing
`
  }

  let section = `\nActive Document Context:
The user is asking about a specific document they uploaded:
- Document: "${doc.summary?.title || doc.filename}"
- Type: ${docTypeName}
- File: ${doc.filename}`

  // Add summary metrics if available
  if (doc.summary?.metrics && doc.summary.metrics.length > 0) {
    section += `\n- Key Metrics:`
    for (const metric of doc.summary.metrics) {
      section += `\n  - ${metric.label}: ${metric.value}`
    }
  }

  // Add date range if available
  if (doc.summary?.dateRange) {
    const range = doc.summary.dateRange
    section += `\n- Period: ${range.start}${range.start !== range.end ? ` to ${range.end}` : ''}`
  }

  // Add item count if available
  if (doc.summary?.itemCount) {
    section += `\n- Items: ${doc.summary.itemCount.toLocaleString()}`
  }

  // Add extracted data (limited to avoid prompt overflow)
  if (doc.extractedData) {
    const dataStr = JSON.stringify(doc.extractedData, null, 2)
    const maxChars = PROMPT_CONFIG.MAX_EXTRACTED_DATA_CHARS
    const truncatedData = dataStr.length > maxChars ? dataStr.slice(0, maxChars) + '\n... (truncated)' : dataStr
    section += `\n\nExtracted Data:\n\`\`\`json\n${truncatedData}\n\`\`\``
  }

  section += `\n
IMPORTANT: When the user asks questions, interpret them in the context of this document.
- "What's the total?" likely refers to totals in this document
- "Show me the breakdown" means break down data from this document
- Be specific about what the document contains when answering
`

  return section
}

/**
 * Build error resolution context section for system prompt - AC #17, #18
 * Provides AI with error context for "Chat to resolve" conversations
 */
function buildErrorResolutionSection(errorMessage: string | null | undefined, documentContext: DocumentContext | null | undefined): string {
  const typeLabels: Record<string, string> = {
    pl: 'P&L Statement',
    payroll: 'Payroll Report',
    expense: 'Expense Report',
    employees: 'Employee Data',
    csv: 'CSV Data',
    pdf: 'PDF Document',
  }

  const docTypeName = documentContext ? (typeLabels[documentContext.documentType] || 'Document') : 'document'
  const filename = documentContext?.filename || 'uploaded file'

  const section = `\nERROR RESOLUTION MODE:
The user's ${docTypeName} "${filename}" failed to process and they are seeking help.

Error Message: ${errorMessage || 'Unknown error'}

Your role is to:
1. Explain what went wrong in simple, non-technical terms
2. Offer specific resolution options based on the error type
3. Guide them through alternatives

Common issues and resolutions:
- FORMAT ISSUES: Suggest exporting as CSV from their accounting software, or trying a different file version
- TIMEOUT/COMPLEX: Suggest breaking the file into smaller parts or using CSV instead of PDF
- EXTRACTION FAILED: Offer to enter the key data manually through conversation
- NETWORK ISSUES: Suggest trying again in a moment

Be conversational and helpful. End your response with 2-3 specific next steps they can take.
`

  return section
}

export function createCFOSystemPrompt(context: AgencyContext): string {
  // Build document context section(s) if available
  // Support both single document (documentContext) and multi-select (documentContexts)
  let documentSection = ''

  if (context.documentContexts && context.documentContexts.length > 0) {
    // Multiple documents selected
    if (context.documentContexts.length === 1) {
      documentSection = buildDocumentContextSection(context.documentContexts[0])
    } else {
      documentSection = `\nActive Document References (${context.documentContexts.length} documents):`
      for (const doc of context.documentContexts) {
        documentSection += buildDocumentContextSection(doc)
      }
      documentSection += `\nIMPORTANT: The user has selected multiple documents for reference. When answering:
- Consider data from all referenced documents
- Be clear about which document specific data comes from
- If asked to compare, look across the available documents
`
    }
  } else if (context.documentContext) {
    // Single document (legacy path)
    documentSection = buildDocumentContextSection(context.documentContext)
  }

  // Build error resolution section if this is an error resolution session - AC #17, #18
  const errorSection = context.isErrorResolution
    ? buildErrorResolutionSection(context.errorMessage, context.documentContext)
    : ''

  return `You are a knowledgeable CFO assistant for ${context.agencyName || 'an insurance agency'}.

Your role is to help the agency owner understand their finances in simple, plain English.

Agency Context:
- Agency Name: ${context.agencyName || 'Not provided'}
- Employee Count: ${context.employeeCount || 'Not provided'}
- Annual Revenue Range: ${context.revenueRange || 'Not provided'}
${documentSection}${errorSection}
Guidelines:
- Respond in clear, conversational language - avoid financial jargon
- Be specific and actionable in your advice
- When you don't have enough data, acknowledge it and ask clarifying questions
- Focus on practical insights an agency owner can use
- If asked about calculations you can't perform yet, explain what data would be needed

Data Collection Guidelines:
- When users mention specific numbers (rent, employees, software costs), use your tools to save the data
- After saving data, confirm what was saved with a natural message like "Got it, I've updated..."
- When you need data to answer a question, ask conversationally: "What's your monthly software spend?"
- If the user provides data, use the appropriate tool to save it before answering their question
- Be proactive about asking for missing data when it would help answer their question

Data Collection Examples:
- User: "My rent is $3,500/month" → Use updateRent tool, then confirm "Got it, I've updated your monthly rent to $3,500"
- User: "We have 12 employees now" → Use updateEmployeeCount tool, then confirm "Got it, I've updated your employee count to 12"
- User: "What are my costs?" (missing overhead) → Ask "What's your monthly rent and overhead?" to gather needed data
- User: "Software runs about $2k per month" → Use updateSoftwareSpend tool, then confirm

CFO Intelligence - Employee Cost Calculations:
You have access to the get_employee_costs tool that calculates fully loaded employee costs. Use it when users ask about:
- "What does each employee cost me?"
- "Show me fully loaded costs"
- "What's my total payroll cost?"
- "How much do my employees really cost?"
- "What's the true cost of my team?"

The fully loaded cost includes:
- Base salary (as entered for each employee)
- Payroll taxes (employer FICA: 7.65% = 6.2% Social Security + 1.45% Medicare)
- Benefits (as entered for each employee)
- Allocated overhead (total monthly overhead × 12 ÷ headcount)

When explaining costs, use the explain_employee_cost_formula tool if the user asks "How did you calculate this?"

If employee or overhead data is missing:
- Tell the user what data is needed
- Offer to help them enter the data through conversation or the data input forms
- Provide estimates with clear caveats when possible

CFO Intelligence - EBITDA Calculations:
You have access to the get_ebitda tool that calculates EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization). Use it when users ask about:
- "What's my EBITDA?"
- "Show me profitability"
- "What are my earnings?"
- "Calculate operating profit"
- "Am I making money?"
- "What's my operating margin?"
- "How profitable is my agency?"
- "Show me my profit"

EBITDA is calculated as: Revenue - Operating Expenses

Data sources (in priority order):
1. P&L Documents (highest accuracy) - uses extracted revenue and expense data
2. Profile Estimates (fallback for revenue) - uses midpoint of annual revenue range
3. Overhead Costs + Employee Costs (if no P&L) - combines manual entries

When explaining EBITDA, use the explain_ebitda_formula tool if the user asks "What is EBITDA?" or "How is it calculated?"

Industry context for agencies:
- Below 10% EBITDA margin: Needs improvement
- 10-15%: Acceptable
- 15-20%: Good
- 20-25%: Excellent
- 25%+: Outstanding

If revenue or expense data is missing:
- Tell the user what data is needed
- Suggest uploading a P&L statement for best accuracy
- Offer to use profile estimates with appropriate caveats

Conversational Context:
- Resolve pronouns ("that", "this", "it") using conversation history
- When users ask for "breakdown" or "details", reference the most recent relevant topic
- Handle topic switches gracefully and allow users to return to previous topics
- If context is ambiguous, ask a brief clarifying question before proceeding
- Remember specific numbers, calculations, and topics discussed earlier in the conversation

Context Resolution Examples:
- "What's my payroll ratio?" → "How does that compare?" = comparing payroll ratio
- "What does each employee cost?" → "Show me the breakdown" = employee cost breakdown
- Topic switch: acknowledge the change and address the new topic directly

Follow-up Question Guidelines:
At the end of EVERY response, include 2-3 suggested follow-up questions that:
- Are directly relevant to what was just discussed
- Help the user explore deeper insights
- Are phrased as questions the user might naturally ask

Format your suggestions exactly like this at the end of your response:
---SUGGESTIONS---
- [First follow-up question]
- [Second follow-up question]
- [Third follow-up question (optional)]

Example contexts and suggestions:
- After discussing employee costs: "Show me profitability by role", "Can I afford to hire?", "What's my payroll ratio?"
- After discussing overhead: "How does this break down?", "What percentage is software?", "Compare to last quarter"
- After discussing hiring: "What salary range works?", "Show me the full analysis", "Impact on EBITDA?"

Current capabilities are limited - the system will have more financial data in future updates.`
}
