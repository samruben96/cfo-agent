/**
 * Unit tests for PDFExtractionPreview component.
 * Story: 3.4 PDF Document Upload
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { PDFExtractionPreview } from './PDFExtractionPreview'

import type { PDFProcessingResult } from '@/lib/documents/pdf-processor'
import type { PLExtraction, PayrollExtraction, GenericExtraction } from '@/lib/documents/extraction-schemas'

const mockPLData: PLExtraction = {
  documentType: 'pl',
  period: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  revenue: {
    total: 500000,
    lineItems: [
      { description: 'Product Sales', amount: 400000 },
      { description: 'Service Revenue', amount: 100000 }
    ]
  },
  expenses: {
    total: 350000,
    categories: [
      { category: 'Salaries', amount: 200000 },
      { category: 'Rent', amount: 50000 },
      { category: 'Utilities', amount: 25000 },
      { category: 'Marketing', amount: 75000 }
    ]
  },
  netIncome: 150000,
  metadata: {
    companyName: 'Test Company Inc.'
  }
}

const mockPayrollData: PayrollExtraction = {
  documentType: 'payroll',
  payPeriod: {
    startDate: '2024-01-01',
    endDate: '2024-01-15'
  },
  employees: [
    { name: 'John Doe', role: 'Engineer', grossPay: 5000, netPay: 3500 },
    { name: 'Jane Smith', role: 'Manager', grossPay: 7000, netPay: 4900 }
  ],
  totals: {
    totalGrossPay: 12000,
    totalNetPay: 8400,
    totalTaxes: 2400,
    totalBenefits: 1200,
    employeeCount: 2
  },
  metadata: {
    companyName: 'Test Company Inc.'
  }
}

const mockGenericData: GenericExtraction = {
  documentType: 'unknown',
  rawContent: 'Some raw extracted content from the document',
  numbers: [
    { label: 'Total', value: 1000 },
    { label: 'Count', value: 50 }
  ]
}

describe('PDFExtractionPreview', () => {
  const defaultProps = {
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  }

  describe('P&L extraction display', () => {
    const plResult: PDFProcessingResult = {
      success: true,
      extractedData: mockPLData,
      processingTimeMs: 2500,
      schemaUsed: 'pl'
    }

    it('renders P&L extraction with correct title', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Extracted Data')).toBeInTheDocument()
      expect(screen.getByText('Profit & Loss')).toBeInTheDocument()
    })

    it('displays processing time', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Processed in 2.5s')).toBeInTheDocument()
    })

    it('displays period information', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText(/Period: 2024-01-01 to 2024-12-31/)).toBeInTheDocument()
    })

    it('displays revenue total', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$500,000')).toBeInTheDocument()
    })

    it('displays expenses total', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Expenses')).toBeInTheDocument()
      expect(screen.getByText('$350,000')).toBeInTheDocument()
    })

    it('displays net income', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Net Income')).toBeInTheDocument()
      expect(screen.getByText('$150,000')).toBeInTheDocument()
    })

    it('displays revenue line items', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Revenue Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Product Sales')).toBeInTheDocument()
      expect(screen.getByText('Service Revenue')).toBeInTheDocument()
    })

    it('displays expense categories', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Expense Categories')).toBeInTheDocument()
      expect(screen.getByText('Salaries')).toBeInTheDocument()
      expect(screen.getByText('Rent')).toBeInTheDocument()
    })

    it('displays company name', () => {
      render(<PDFExtractionPreview result={plResult} {...defaultProps} />)

      expect(screen.getByText('Company: Test Company Inc.')).toBeInTheDocument()
    })
  })

  describe('Payroll extraction display', () => {
    const payrollResult: PDFProcessingResult = {
      success: true,
      extractedData: mockPayrollData,
      processingTimeMs: 1800,
      schemaUsed: 'payroll'
    }

    it('renders Payroll extraction with correct badge', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText('Payroll Report')).toBeInTheDocument()
    })

    it('displays pay period information', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText(/Pay Period: 2024-01-01 to 2024-01-15/)).toBeInTheDocument()
    })

    it('displays employee count', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      // There are two "Employees" elements - one in metric card, one as section header
      expect(screen.getAllByText('Employees')).toHaveLength(2)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('displays gross pay total', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText('Gross Pay')).toBeInTheDocument()
      expect(screen.getByText('$12,000')).toBeInTheDocument()
    })

    it('displays net pay total', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText('Net Pay')).toBeInTheDocument()
      expect(screen.getByText('$8,400')).toBeInTheDocument()
    })

    it('displays taxes and benefits', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText('Taxes: $2,400')).toBeInTheDocument()
      expect(screen.getByText('Benefits: $1,200')).toBeInTheDocument()
    })

    it('displays employee list', () => {
      render(<PDFExtractionPreview result={payrollResult} {...defaultProps} />)

      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    })
  })

  describe('Generic extraction display', () => {
    const genericResult: PDFProcessingResult = {
      success: true,
      extractedData: mockGenericData,
      processingTimeMs: 1000,
      schemaUsed: 'generic'
    }

    it('renders generic extraction with Document badge', () => {
      render(<PDFExtractionPreview result={genericResult} {...defaultProps} />)

      expect(screen.getByText('Document')).toBeInTheDocument()
    })

    it('displays unknown type message', () => {
      render(<PDFExtractionPreview result={genericResult} {...defaultProps} />)

      expect(screen.getByText(/Document type could not be automatically detected/)).toBeInTheDocument()
    })

    it('displays raw content', () => {
      render(<PDFExtractionPreview result={genericResult} {...defaultProps} />)

      expect(screen.getByText('Extracted Content')).toBeInTheDocument()
      expect(screen.getByText('Some raw extracted content from the document')).toBeInTheDocument()
    })

    it('displays extracted numbers', () => {
      render(<PDFExtractionPreview result={genericResult} {...defaultProps} />)

      expect(screen.getByText('Extracted Numbers')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('1,000')).toBeInTheDocument()
    })
  })

  describe('Button interactions', () => {
    const result: PDFProcessingResult = {
      success: true,
      extractedData: mockPLData,
      processingTimeMs: 1000,
      schemaUsed: 'pl'
    }

    it('calls onConfirm when Confirm & Save is clicked', () => {
      const onConfirm = vi.fn()
      render(<PDFExtractionPreview result={result} onConfirm={onConfirm} onCancel={vi.fn()} />)

      fireEvent.click(screen.getByText('Confirm & Save'))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when Cancel is clicked', () => {
      const onCancel = vi.fn()
      render(<PDFExtractionPreview result={result} onConfirm={vi.fn()} onCancel={onCancel} />)

      fireEvent.click(screen.getByText('Cancel'))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading state', () => {
    const result: PDFProcessingResult = {
      success: true,
      extractedData: mockPLData,
      processingTimeMs: 1000,
      schemaUsed: 'pl'
    }

    it('disables buttons when isLoading is true', () => {
      render(<PDFExtractionPreview result={result} {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Cancel')).toBeDisabled()
      expect(screen.getByText('Saving...')).toBeDisabled()
    })

    it('shows "Saving..." text when isLoading', () => {
      render(<PDFExtractionPreview result={result} {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('buttons are enabled when not loading', () => {
      render(<PDFExtractionPreview result={result} {...defaultProps} isLoading={false} />)

      expect(screen.getByText('Cancel')).not.toBeDisabled()
      expect(screen.getByText('Confirm & Save')).not.toBeDisabled()
    })
  })

  describe('Edge cases', () => {
    it('handles P&L without line items', () => {
      const minimalPL: PLExtraction = {
        documentType: 'pl',
        revenue: { total: 100000 },
        expenses: { total: 80000 }
      }
      const result: PDFProcessingResult = {
        success: true,
        extractedData: minimalPL,
        processingTimeMs: 500,
        schemaUsed: 'pl'
      }

      render(<PDFExtractionPreview result={result} {...defaultProps} />)

      expect(screen.getByText('$100,000')).toBeInTheDocument()
      expect(screen.queryByText('Revenue Breakdown')).not.toBeInTheDocument()
    })

    it('handles Payroll without employees list', () => {
      const minimalPayroll: PayrollExtraction = {
        documentType: 'payroll',
        totals: {
          totalGrossPay: 50000,
          totalNetPay: 35000,
          employeeCount: 5
        }
      }
      const result: PDFProcessingResult = {
        success: true,
        extractedData: minimalPayroll,
        processingTimeMs: 800,
        schemaUsed: 'payroll'
      }

      render(<PDFExtractionPreview result={result} {...defaultProps} />)

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })

    it('handles generic extraction without numbers', () => {
      const minimalGeneric: GenericExtraction = {
        documentType: 'unknown',
        rawContent: 'Just some text'
      }
      const result: PDFProcessingResult = {
        success: true,
        extractedData: minimalGeneric,
        processingTimeMs: 300,
        schemaUsed: 'generic'
      }

      render(<PDFExtractionPreview result={result} {...defaultProps} />)

      expect(screen.getByText('Just some text')).toBeInTheDocument()
      expect(screen.queryByText('Extracted Numbers')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const result: PDFProcessingResult = {
        success: true,
        extractedData: mockPLData,
        processingTimeMs: 1000,
        schemaUsed: 'pl'
      }

      const { container } = render(
        <PDFExtractionPreview result={result} {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
