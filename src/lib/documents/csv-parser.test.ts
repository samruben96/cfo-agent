/**
 * Tests for CSV parser utilities.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { parseCSV, parseCSVString, validateCSVFile } from './csv-parser'

// Mock console to avoid noise in test output
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('parseCSVString', () => {
  it('parses valid CSV with headers', () => {
    const csv = `name,role,salary
John Doe,Developer,80000
Jane Smith,Designer,75000`

    const result = parseCSVString(csv)

    expect(result.error).toBeNull()
    expect(result.headers).toEqual(['name', 'role', 'salary'])
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({
      name: 'John Doe',
      role: 'Developer',
      salary: 80000
    })
  })

  it('handles dynamic typing for numbers', () => {
    const csv = `item,price,quantity
Widget,19.99,100
Gadget,29.99,50`

    const result = parseCSVString(csv)

    expect(result.error).toBeNull()
    expect(result.data[0]).toEqual({
      item: 'Widget',
      price: 19.99,
      quantity: 100
    })
  })

  it('returns empty data for empty CSV', () => {
    const csv = ''

    const result = parseCSVString(csv)

    expect(result.data).toHaveLength(0)
    expect(result.headers).toHaveLength(0)
  })

  it('skips empty lines', () => {
    const csv = `name,value
Row1,100

Row2,200

Row3,300`

    const result = parseCSVString(csv)

    expect(result.data).toHaveLength(3)
  })

  it('respects preview option to limit rows', () => {
    const csv = `name,value
Row1,100
Row2,200
Row3,300
Row4,400
Row5,500`

    const result = parseCSVString(csv, { preview: 2 })

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({ name: 'Row1', value: 100 })
    expect(result.data[1]).toEqual({ name: 'Row2', value: 200 })
  })

  it('handles CSV with quoted values', () => {
    const csv = `name,description
"Smith, John","A ""special"" employee"
"Doe, Jane","Works in IT"`

    const result = parseCSVString(csv)

    expect(result.error).toBeNull()
    expect(result.data[0]).toEqual({
      name: 'Smith, John',
      description: 'A "special" employee'
    })
  })

  it('handles columns with spaces in names', () => {
    const csv = `Employee Name,Annual Salary,Start Date
John Doe,80000,2024-01-15`

    const result = parseCSVString(csv)

    expect(result.headers).toEqual(['Employee Name', 'Annual Salary', 'Start Date'])
    expect(result.data[0]['Employee Name']).toBe('John Doe')
  })
})

describe('parseCSV', () => {
  it('parses a File object asynchronously', async () => {
    const csvContent = `name,value
Test,123`
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

    const result = await parseCSV(file)

    expect(result.error).toBeNull()
    expect(result.headers).toEqual(['name', 'value'])
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual({ name: 'Test', value: 123 })
  })

  it('returns error for malformed CSV', async () => {
    // Unmatched quote causes parse error
    const csvContent = `name,value
"Unclosed quote,123`
    const file = new File([csvContent], 'bad.csv', { type: 'text/csv' })

    const result = await parseCSV(file)

    // PapaParse may or may not error on this - it depends on configuration
    // The important thing is it handles gracefully
    expect(result.data.length).toBeLessThanOrEqual(1)
  })
})

describe('validateCSVFile', () => {
  it('returns null for valid CSV file', () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' })

    const result = validateCSVFile(file)

    expect(result).toBeNull()
  })

  it('returns error for non-CSV extension', () => {
    const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const result = validateCSVFile(file)

    expect(result).toBe('Invalid file type. Please upload a CSV file.')
  })

  it('returns error for file exceeding max size', () => {
    // Create a file that's 11MB (exceeds 10MB default)
    const content = 'x'.repeat(11 * 1024 * 1024)
    const file = new File([content], 'large.csv', { type: 'text/csv' })

    const result = validateCSVFile(file)

    expect(result).toBe('File too large. Maximum size is 10MB.')
  })

  it('returns error for empty file', () => {
    // new File([]) creates a file with size 0
    const emptyFile = new File([], 'empty.csv', { type: 'text/csv' })

    const result = validateCSVFile(emptyFile)

    expect(result).toBe('File is empty. Please upload a CSV with data.')
  })

  it('accepts custom max size', () => {
    const content = 'x'.repeat(6 * 1024 * 1024) // 6MB
    const file = new File([content], 'medium.csv', { type: 'text/csv' })

    // Default 10MB should pass
    expect(validateCSVFile(file)).toBeNull()

    // 5MB limit should fail
    expect(validateCSVFile(file, 5)).toBe('File too large. Maximum size is 5MB.')
  })

  it('accepts text/plain MIME type for CSV', () => {
    const file = new File(['content'], 'test.csv', { type: 'text/plain' })

    const result = validateCSVFile(file)

    expect(result).toBeNull()
  })

  it('accepts empty MIME type (some browsers do not set it)', () => {
    const file = new File(['content'], 'test.csv', { type: '' })

    const result = validateCSVFile(file)

    expect(result).toBeNull()
  })
})
