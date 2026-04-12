import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Phase 1: Simple project retrieval
    const projects = await DatabaseService.getAllProjects({
      limit: 50, // Reasonable default limit for Phase 1
      offset: 0,
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, platform, sketchUrl, generatedCode, codeLanguage, tags, userId } = body

    // Phase 1: Basic validation
    if (!name || !platform || !userId) {
      return NextResponse.json(
        { error: 'Name, platform, and userId are required' },
        { status: 400 }
      )
    }

    const project = await DatabaseService.createProject({
      name,
      description,
      platform,
      userId,
      sketchUrl,
      generatedCode,
      codeLanguage
      // tags removed - not in SQLite schema
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// Phase 2: Advanced features (commented out for now)
/*
// Enhanced GET with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Advanced filtering and search
    const projects = await DatabaseService.getAllProjects({
      status: status || undefined,
      platform: platform || undefined,
      limit,
      offset,
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// Enhanced POST with validation and business logic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, platform, sketchUrl, generatedCode, codeLanguage, tags } = body

    // Phase 2: Enhanced validation
    if (!name || !platform) {
      return NextResponse.json(
        { error: 'Name and platform are required' },
        { status: 400 }
      )
    }

    // Additional validation rules
    if (name.length < 3) {
      return NextResponse.json(
        { error: 'Project name must be at least 3 characters long' },
        { status: 400 }
      )
    }

    if (tags && tags.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 tags allowed' },
        { status: 400 }
      )
    }

    const project = await DatabaseService.createProject({
      name,
      description,
      platform,
      userId: undefined,
      sketchUrl,
      generatedCode,
      codeLanguage,
      tags,
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
*/ 