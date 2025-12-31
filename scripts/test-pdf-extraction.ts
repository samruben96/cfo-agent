/**
 * Performance test script for Story 3.5.5
 * Tests the PDF text extraction pipeline with complex documents.
 *
 * Run with: npx tsx scripts/test-pdf-extraction.ts
 */

import * as fs from 'fs'
import pdfParse from 'pdf-parse'

// Import the tabular content detector
import { detectTabularContent } from '../src/lib/documents/pdf-text-extractor'

const TEST_PDF_PATH = '/Users/samruben/Downloads/Nexus_Technologies_FY2024_Financial_Report.pdf'

async function runTest() {
  console.log('=' .repeat(60))
  console.log('Story 3.5.5 Performance Test: PDF Text Extraction')
  console.log('=' .repeat(60))
  console.log()

  // Check if file exists
  if (!fs.existsSync(TEST_PDF_PATH)) {
    console.error('❌ Test PDF not found at:', TEST_PDF_PATH)
    process.exit(1)
  }

  const fileStats = fs.statSync(TEST_PDF_PATH)
  console.log('📄 Test Document: Nexus_Technologies_FY2024_Financial_Report.pdf')
  console.log(`   File size: ${(fileStats.size / 1024).toFixed(1)} KB`)
  console.log()

  // Read PDF file
  const pdfBuffer = fs.readFileSync(TEST_PDF_PATH)

  console.log('🔄 Starting text extraction with pdf-parse...')
  console.log()

  const startTime = Date.now()

  try {
    const result = await pdfParse(pdfBuffer)
    const totalTime = Date.now() - startTime

    console.log('=' .repeat(60))
    console.log('📊 RESULTS')
    console.log('=' .repeat(60))
    console.log()

    console.log('✅ Text extraction: SUCCESS')
    console.log(`⏱️  Processing time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
    console.log(`📑 Pages extracted: ${result.numpages}`)
    console.log(`📝 Text length: ${result.text.length.toLocaleString()} characters`)
    console.log()

    // Check for tabular content
    const hasTabularContent = detectTabularContent(result.text)
    console.log(`📊 Contains tabular data: ${hasTabularContent ? 'YES' : 'NO'}`)
    console.log()

    // Show sample of extracted text
    console.log('📝 Sample extracted text (first 500 chars):')
    console.log('-'.repeat(60))
    console.log(result.text.substring(0, 500))
    console.log('-'.repeat(60))
    console.log()

    // Performance assessment
    console.log('=' .repeat(60))
    console.log('📈 PERFORMANCE ASSESSMENT')
    console.log('=' .repeat(60))
    console.log()

    const TARGET_TIME = 60000 // 60 seconds target
    const OLD_TIME = 900000 // 15 minutes (old timeout)

    if (totalTime < TARGET_TIME) {
      console.log(`✅ PASS: Extraction completed in ${(totalTime / 1000).toFixed(2)}s (target: < 60s)`)
      console.log(`   Improvement: ${((OLD_TIME - totalTime) / OLD_TIME * 100).toFixed(1)}% faster than old timeout`)
    } else {
      console.log(`❌ FAIL: Extraction took ${(totalTime / 1000).toFixed(2)}s (target: < 60s)`)
    }

    // Log ready for GPT-4o processing
    console.log()
    console.log('💡 Next step: This extracted text can be sent to GPT-4o for')
    console.log('   structured data extraction (not Vision API).')

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('❌ Extraction failed with error:')
    console.error(error)
    console.log(`⏱️  Processing time before failure: ${totalTime}ms`)
  }

  console.log()
  console.log('=' .repeat(60))
  console.log('Test complete')
  console.log('=' .repeat(60))
}

runTest().catch(console.error)
