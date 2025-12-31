/**
 * Zod schemas for PDF financial data extraction.
 * Story: 3.4 PDF Document Upload
 *
 * These schemas define the structure for extracting financial data
 * from P&L statements and payroll documents using GPT-5.2 Vision.
 */

import { z } from 'zod'

/**
 * Line item schema for revenue/expense entries.
 */
const lineItemSchema = z.object({
  description: z.string().describe('Name or description of the line item'),
  amount: z.number().describe('Dollar amount for this line item'),
})

/**
 * Expense category schema with nested line items.
 * Note: All fields required for OpenAI structured outputs compatibility.
 */
const expenseCategorySchema = z.object({
  category: z.string().describe('Category name (e.g., "Payroll", "Marketing", "Rent")'),
  amount: z.number().describe('Total amount for this category'),
  lineItems: z.array(lineItemSchema).describe('Individual line items within this category, empty array if none'),
})

/**
 * P&L (Profit & Loss) extraction schema.
 * Used for income statements, P&L reports, and profit/loss documents.
 * Note: Nested object fields are required for OpenAI structured outputs compatibility.
 */
export const plExtractionSchema = z.object({
  documentType: z.enum(['pl', 'income_statement', 'profit_loss']).describe('Type of financial document'),
  period: z.object({
    startDate: z.string().describe('Start date of the reporting period (YYYY-MM-DD), empty string if unknown'),
    endDate: z.string().describe('End date of the reporting period (YYYY-MM-DD), empty string if unknown'),
  }).describe('Reporting period for this statement'),
  revenue: z.object({
    total: z.number().describe('Total revenue/income amount'),
    lineItems: z.array(lineItemSchema).describe('Individual revenue line items, empty array if none'),
  }).describe('Revenue/income section'),
  expenses: z.object({
    total: z.number().describe('Total expenses amount'),
    categories: z.array(expenseCategorySchema).describe('Expense categories with amounts, empty array if none'),
  }).describe('Expenses section'),
  netIncome: z.number().describe('Net income (revenue minus expenses), 0 if unknown'),
  metadata: z.object({
    companyName: z.string().describe('Company name, empty string if not visible'),
    preparedBy: z.string().describe('Preparer name, empty string if not visible'),
    pageCount: z.number().describe('Number of pages in the document, 1 if unknown'),
  }).describe('Document metadata'),
})

/**
 * Employee entry schema for payroll documents.
 * Note: All fields required for OpenAI structured outputs compatibility.
 * Use empty string for unknown text, 0 for unknown numbers.
 */
const employeeEntrySchema = z.object({
  name: z.string().describe('Employee name, empty string if unknown'),
  role: z.string().describe('Job title or role, empty string if unknown'),
  hoursWorked: z.number().describe('Hours worked in period, 0 if unknown'),
  grossPay: z.number().describe('Gross pay amount, 0 if unknown'),
  taxes: z.number().describe('Tax withholdings, 0 if unknown'),
  benefits: z.number().describe('Benefits deductions, 0 if unknown'),
  netPay: z.number().describe('Net pay (take-home), 0 if unknown'),
})

/**
 * Payroll extraction schema.
 * Used for payroll reports, pay summaries, and payroll documents.
 * Note: Nested object fields are required for OpenAI structured outputs compatibility.
 */
export const payrollExtractionSchema = z.object({
  documentType: z.enum(['payroll', 'payroll_summary', 'payroll_report']).describe('Type of payroll document'),
  payPeriod: z.object({
    startDate: z.string().describe('Pay period start date (YYYY-MM-DD), empty string if unknown'),
    endDate: z.string().describe('Pay period end date (YYYY-MM-DD), empty string if unknown'),
  }).describe('Pay period dates'),
  employees: z.array(employeeEntrySchema).describe('Individual employee pay details, empty array if none found'),
  totals: z.object({
    totalGrossPay: z.number().describe('Total gross pay for all employees, 0 if unknown'),
    totalTaxes: z.number().describe('Total tax withholdings, 0 if unknown'),
    totalBenefits: z.number().describe('Total benefits deductions, 0 if unknown'),
    totalNetPay: z.number().describe('Total net pay, 0 if unknown'),
    employeeCount: z.number().describe('Number of employees, 0 if unknown'),
  }).describe('Payroll totals'),
  metadata: z.object({
    companyName: z.string().describe('Company name, empty string if not visible'),
    payrollProvider: z.string().describe('Payroll provider name, empty string if not visible'),
  }).describe('Document metadata'),
})

/**
 * Generic extraction schema for unknown document types.
 * Falls back to raw content extraction.
 * Note: All fields required for OpenAI structured outputs compatibility.
 */
export const genericExtractionSchema = z.object({
  documentType: z.literal('unknown').describe('Unknown document type'),
  rawContent: z.string().describe('Raw text content extracted from document'),
  tables: z.array(z.array(z.string())).describe('Any tables found in the document, empty array if none'),
  numbers: z.array(z.object({
    label: z.string().describe('Label or description for the number, empty string if unknown'),
    value: z.number().describe('The numeric value'),
  })).describe('Numeric values found with their labels, empty array if none'),
})

/**
 * Combined extraction result schema.
 * Used to determine which type of extraction was performed.
 */
export const extractionResultSchema = z.discriminatedUnion('documentType', [
  plExtractionSchema,
  payrollExtractionSchema,
  genericExtractionSchema,
])

// Export types derived from schemas
export type PLExtraction = z.infer<typeof plExtractionSchema>
export type PayrollExtraction = z.infer<typeof payrollExtractionSchema>
export type GenericExtraction = z.infer<typeof genericExtractionSchema>
export type ExtractionResult = z.infer<typeof extractionResultSchema>
