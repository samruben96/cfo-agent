'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react'

import type { PDFProcessingResult } from '@/lib/documents/pdf-processor'
import type { PLExtraction, PayrollExtraction, ExpenseExtraction } from '@/lib/documents/extraction-schemas'

interface PDFExtractionPreviewProps {
  result: PDFProcessingResult
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

/**
 * Preview component for PDF extraction results.
 * Displays extracted financial data (P&L or Payroll) with confirm/cancel actions.
 */
export function PDFExtractionPreview({
  result,
  onConfirm,
  onCancel,
  isLoading = false,
  className
}: PDFExtractionPreviewProps) {
  const { extractedData, schemaUsed, processingTimeMs } = result
  const processingSeconds = (processingTimeMs / 1000).toFixed(1)

  const getSchemaLabel = () => {
    switch (schemaUsed) {
      case 'pl':
        return 'Profit & Loss'
      case 'payroll':
        return 'Payroll Report'
      case 'expense':
        return 'Expense Report'
      default:
        return 'Document'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-h3">Extracted Data</CardTitle>
          </div>
          <Badge variant="default">{getSchemaLabel()}</Badge>
        </div>
        <div className="flex items-center gap-2 text-small text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Processed in {processingSeconds}s</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {schemaUsed === 'pl' && (
          <PLExtractionSummary data={extractedData as PLExtraction} />
        )}
        {schemaUsed === 'payroll' && (
          <PayrollExtractionSummary data={extractedData as PayrollExtraction} />
        )}
        {schemaUsed === 'expense' && (
          <ExpenseExtractionSummary data={extractedData as ExpenseExtraction} />
        )}
        {schemaUsed === 'generic' && (
          <GenericExtractionSummary data={extractedData} />
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Confirm & Save'}
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * P&L extraction summary display.
 */
function PLExtractionSummary({ data }: { data: PLExtraction }) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Period info */}
      {data.period && (data.period.startDate || data.period.endDate) && (
        <p className="text-small text-muted-foreground">
          Period: {data.period.startDate || '?'} to {data.period.endDate || '?'}
        </p>
      )}

      {/* Key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-small font-medium text-green-700 dark:text-green-400">Revenue</span>
          </div>
          <p className="text-h3 font-bold text-green-700 dark:text-green-400">
            {formatCurrency(data.revenue.total)}
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-small font-medium text-red-700 dark:text-red-400">Expenses</span>
          </div>
          <p className="text-h3 font-bold text-red-700 dark:text-red-400">
            {formatCurrency(data.expenses.total)}
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-small font-medium text-blue-700 dark:text-blue-400">Net Income</span>
          </div>
          <p className="text-h3 font-bold text-blue-700 dark:text-blue-400">
            {formatCurrency(data.netIncome)}
          </p>
        </div>
      </div>

      {/* Revenue line items */}
      {data.revenue.lineItems && data.revenue.lineItems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-small font-medium mb-2">Revenue Breakdown</h4>
          <div className="space-y-1">
            {data.revenue.lineItems.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between text-small">
                <span className="text-muted-foreground">{item.description}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {data.revenue.lineItems.length > 5 && (
              <p className="text-small text-muted-foreground">
                +{data.revenue.lineItems.length - 5} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Expense categories */}
      {data.expenses.categories && data.expenses.categories.length > 0 && (
        <div className="mt-4">
          <h4 className="text-small font-medium mb-2">Expense Categories</h4>
          <div className="space-y-1">
            {data.expenses.categories.slice(0, 5).map((category, index) => (
              <div key={index} className="flex justify-between text-small">
                <span className="text-muted-foreground">{category.category}</span>
                <span>{formatCurrency(category.amount)}</span>
              </div>
            ))}
            {data.expenses.categories.length > 5 && (
              <p className="text-small text-muted-foreground">
                +{data.expenses.categories.length - 5} more categories
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {data.metadata?.companyName && (
        <p className="text-small text-muted-foreground mt-4">
          Company: {data.metadata.companyName}
        </p>
      )}
    </div>
  )
}

/**
 * Payroll extraction summary display.
 */
function PayrollExtractionSummary({ data }: { data: PayrollExtraction }) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Period info */}
      {data.payPeriod && (data.payPeriod.startDate || data.payPeriod.endDate) && (
        <p className="text-small text-muted-foreground">
          Pay Period: {data.payPeriod.startDate || '?'} to {data.payPeriod.endDate || '?'}
        </p>
      )}

      {/* Key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-primary/10 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-small font-medium">Employees</span>
          </div>
          <p className="text-h3 font-bold">
            {data.totals?.employeeCount ?? data.employees?.length ?? 'N/A'}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-small font-medium text-green-700 dark:text-green-400">Gross Pay</span>
          </div>
          <p className="text-h3 font-bold text-green-700 dark:text-green-400">
            {formatCurrency(data.totals?.totalGrossPay)}
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-small font-medium text-blue-700 dark:text-blue-400">Net Pay</span>
          </div>
          <p className="text-h3 font-bold text-blue-700 dark:text-blue-400">
            {formatCurrency(data.totals?.totalNetPay)}
          </p>
        </div>
      </div>

      {/* Deductions summary */}
      {(data.totals?.totalTaxes || data.totals?.totalBenefits) && (
        <div className="flex gap-4 text-small">
          {data.totals?.totalTaxes !== undefined && (
            <span className="text-muted-foreground">
              Taxes: {formatCurrency(data.totals.totalTaxes)}
            </span>
          )}
          {data.totals?.totalBenefits !== undefined && (
            <span className="text-muted-foreground">
              Benefits: {formatCurrency(data.totals.totalBenefits)}
            </span>
          )}
        </div>
      )}

      {/* Employee list preview */}
      {data.employees && data.employees.length > 0 && (
        <div className="mt-4">
          <h4 className="text-small font-medium mb-2">Employees</h4>
          <div className="space-y-1">
            {data.employees.slice(0, 5).map((employee, index) => (
              <div key={index} className="flex justify-between text-small">
                <span className="text-muted-foreground">
                  {employee.name || 'Unknown'} {employee.role && `(${employee.role})`}
                </span>
                <span>{formatCurrency(employee.netPay)}</span>
              </div>
            ))}
            {data.employees.length > 5 && (
              <p className="text-small text-muted-foreground">
                +{data.employees.length - 5} more employees
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {data.metadata?.companyName && (
        <p className="text-small text-muted-foreground mt-4">
          Company: {data.metadata.companyName}
        </p>
      )}
    </div>
  )
}

/**
 * Expense report extraction summary display.
 */
function ExpenseExtractionSummary({ data }: { data: ExpenseExtraction }) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Period info */}
      {data.period?.month && (
        <p className="text-small text-muted-foreground">
          Period: {data.period.month}
        </p>
      )}

      {/* Total expenses highlight */}
      <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-orange-600" />
          <span className="text-small font-medium text-orange-700 dark:text-orange-400">Total Expenses</span>
        </div>
        <p className="text-h3 font-bold text-orange-700 dark:text-orange-400">
          {formatCurrency(data.summary?.totalExpenses)}
        </p>
      </div>

      {/* Category breakdown */}
      {data.summary?.categories && data.summary.categories.length > 0 && (
        <div>
          <h4 className="text-small font-medium mb-2">Expense Categories ({data.summary.categories.length})</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.summary.categories.map((category, index) => (
              <div key={index} className="flex justify-between text-small py-1 border-b border-muted/30 last:border-0">
                <span className="text-muted-foreground">{category.category}</span>
                <span className="font-medium">{formatCurrency(category.currentPeriod)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line items preview */}
      {data.lineItems && data.lineItems.length > 0 && (
        <div>
          <h4 className="text-small font-medium mb-2">Recent Transactions ({data.lineItems.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.lineItems.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between text-small py-1">
                <span className="text-muted-foreground truncate max-w-[60%]">
                  {item.vendor || item.description}
                </span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {data.lineItems.length > 5 && (
              <p className="text-small text-muted-foreground">
                +{data.lineItems.length - 5} more transactions
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {data.metadata?.companyName && (
        <p className="text-small text-muted-foreground mt-4">
          Company: {data.metadata.companyName}
        </p>
      )}
    </div>
  )
}

/**
 * Generic extraction summary for unknown document types.
 */
function GenericExtractionSummary({ data }: { data: unknown }) {
  const genericData = data as { rawContent?: string; tables?: string[][]; numbers?: { label?: string; value: number }[] }

  return (
    <div className="space-y-4">
      <p className="text-small text-muted-foreground">
        Document type could not be automatically detected. Raw extraction data is shown below.
      </p>

      {/* Raw content preview */}
      {genericData.rawContent && (
        <div className="p-4 bg-muted/30 rounded-md">
          <h4 className="text-small font-medium mb-2">Extracted Content</h4>
          <p className="text-small whitespace-pre-wrap line-clamp-10">
            {genericData.rawContent}
          </p>
        </div>
      )}

      {/* Extracted numbers */}
      {genericData.numbers && genericData.numbers.length > 0 && (
        <div>
          <h4 className="text-small font-medium mb-2">Extracted Numbers</h4>
          <div className="space-y-1">
            {genericData.numbers.slice(0, 10).map((item, index) => (
              <div key={index} className="flex justify-between text-small">
                <span className="text-muted-foreground">{item.label || 'Value'}</span>
                <span>{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
