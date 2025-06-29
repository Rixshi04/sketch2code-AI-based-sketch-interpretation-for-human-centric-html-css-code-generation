import { NextRequest, NextResponse } from 'next/server'
import { AIService, CodeGenerationRequest } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body: CodeGenerationRequest = await request.json()
    
    // Validate request
    if (!body.imageUrl || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl and platform' },
        { status: 400 }
      )
    }

    // Validate platform
    const validPlatforms = ['react', 'vue', 'angular', 'flutter', 'swiftui']
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Supported platforms: ' + validPlatforms.join(', ') },
        { status: 400 }
      )
    }

    // Generate code using AI service
    const result = await AIService.generateCode(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'SketchMaster Code Generation API' },
    { status: 200 }
  )
} 