import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const isPremium = searchParams.get('isPremium')
    const isPublished = searchParams.get('isPublished')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') as 'rating' | 'downloads' | 'createdAt' | 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc'
    const search = searchParams.get('search')

    if (search) {
      const templates = await DatabaseService.searchTemplates(search, {
        category: category || undefined,
        platform: platform || undefined,
        isPremium: isPremium === 'true',
        limit,
        offset,
      })
      return NextResponse.json(templates)
    }

    const templates = await DatabaseService.getTemplates({
      category: category || undefined,
      platform: platform || undefined,
      isPremium: isPremium === 'true',
      isPublished: isPublished === 'true',
      limit,
      offset,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      platform,
      codeContent,
      codeLanguage,
      thumbnail,
      previewUrl,
      isPremium,
      price,
      tags,
      features,
    } = body

    if (!name || !category || !platform || !codeContent || !codeLanguage) {
      return NextResponse.json(
        { error: 'Name, category, platform, codeContent, and codeLanguage are required' },
        { status: 400 }
      )
    }

    const template = await DatabaseService.createTemplate({
      name,
      description,
      category,
      platform,
      userId: session.user.id,
      codeContent,
      codeLanguage,
      thumbnail,
      previewUrl,
      isPremium,
      price,
      tags,
      features,
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
} 