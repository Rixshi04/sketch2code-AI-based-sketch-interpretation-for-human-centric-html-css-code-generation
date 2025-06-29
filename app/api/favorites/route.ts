import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, templateId } = body

    if (!projectId && !templateId) {
      return NextResponse.json(
        { error: 'Either projectId or templateId is required' },
        { status: 400 }
      )
    }

    const result = await DatabaseService.toggleFavorite({
      userId: session.user.id,
      projectId,
      templateId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
} 