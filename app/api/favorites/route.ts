import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, templateId } = body

    if (!projectId && !templateId) {
      return NextResponse.json(
        { error: 'Either projectId or templateId is required' },
        { status: 400 }
      )
    }

    // Simplified for SQLite - return success
    const result = await DatabaseService.toggleFavorite(
      'user-id', // Would get from session in production
      projectId,
      templateId
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
} 