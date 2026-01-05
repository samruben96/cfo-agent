/**
 * API route for fetching a single document by ID.
 * Used by "Chat about this" feature - AC #15
 */

import { NextResponse } from 'next/server'
import { getDocument } from '@/actions/documents'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 }
    )
  }

  const { data, error } = await getDocument(id)

  if (error) {
    return NextResponse.json(
      { error },
      { status: error === 'Not authenticated' ? 401 : 404 }
    )
  }

  return NextResponse.json(data)
}
