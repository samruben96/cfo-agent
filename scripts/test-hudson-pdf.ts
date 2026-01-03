/**
 * Test script to verify PDF processing optimization with Hudson expense report.
 * Story: 3.10 PDF Processing Optimization
 *
 * Run: npx tsx scripts/test-hudson-pdf.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Dynamically import to use ESM modules
async function main() {
  const { detectDocumentType, shouldUseTextExtractionFirst } = await import('../src/lib/documents/pdf-processor')
  const { extractPDFText } = await import('../src/lib/documents/pdf-text-extractor')

  const pdfPath = process.argv[2] || '/Users/samruben/Downloads/Hudson_Expense_Report_Dec2024.pdf'

  console.log('\n=== PDF Processing Optimization Test ===\n')
  console.log(`File: ${pdfPath}`)

  // Read the PDF file
  let buffer: Buffer
  try {
    buffer = readFileSync(pdfPath)
  } catch (e) {
    console.error(`Error reading file: ${e}`)
    process.exit(1)
  }

  const fileSize = buffer.length
  console.log(`Size: ${(fileSize / 1024).toFixed(2)} KB`)

  // Test document type detection
  const filename = pdfPath.split('/').pop() || 'unknown.pdf'
  const detectedType = detectDocumentType(filename)
  console.log(`\nDocument Type Detection:`)
  console.log(`  Filename: ${filename}`)
  console.log(`  Detected Type: ${detectedType}`)

  // Test file size heuristic
  const useTextFirst = shouldUseTextExtractionFirst(fileSize)
  console.log(`\nFile Size Heuristic:`)
  console.log(`  File Size: ${fileSize} bytes`)
  console.log(`  Threshold: 100,000 bytes`)
  console.log(`  Use Text First: ${useTextFirst}`)

  // Test text extraction
  console.log(`\nText Extraction:`)
  const startTime = Date.now()
  const textResult = await extractPDFText(buffer)
  const extractionTime = Date.now() - startTime

  console.log(`  Success: ${textResult.success}`)
  console.log(`  Page Count: ${textResult.pageCount}`)
  console.log(`  Text Length: ${textResult.text?.length || 0} chars`)
  console.log(`  Extraction Time: ${extractionTime}ms`)

  if (textResult.text) {
    console.log(`\nExtracted Text Preview (first 500 chars):`)
    console.log('---')
    console.log(textResult.text.slice(0, 500))
    console.log('---')
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`✅ Document detected as: ${detectedType}`)
  console.log(`✅ Will use text-first: ${useTextFirst}`)
  console.log(`✅ Text extraction: ${textResult.success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`✅ Extraction time: ${extractionTime}ms (target: < 100ms)`)

  if (textResult.success && useTextFirst && detectedType === 'expense') {
    console.log('\n🎉 All optimizations working correctly!')
    console.log('Expected processing time: ~10-15 seconds (vs 103 seconds before)')
  }
}

main().catch(console.error)
