import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Template metadata
const TEMPLATES = [
  {
    id: 'landing_page',
    name: 'Landing Page',
    description: 'Modern landing page with hero section, features, and CTA',
    category: 'marketing',
    thumbnail: '🚀'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Professional portfolio showcase with projects and skills',
    category: 'personal',
    thumbnail: '💼'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Complete online store with products, cart, and checkout',
    category: 'business',
    thumbnail: '🛒'
  },
  {
    id: 'login_page',
    name: 'Login Page',
    description: 'Clean authentication page with social login options',
    category: 'auth',
    thumbnail: '🔐'
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics dashboard with charts, stats, and tables',
    category: 'admin',
    thumbnail: '📊'
  }
]

// GET /api/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    // If specific template requested
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === templateId)
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      try {
        const templatePath = join(process.cwd(), 'templates', `${templateId}.html`)
        const htmlContent = await readFile(templatePath, 'utf-8')
        
        // Extract CSS from style tags
        const cssMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/)
        const css = cssMatch ? cssMatch[1] : ''
        
        // Extract HTML body content
        const bodyMatch = htmlContent.match(/<body>([\s\S]*?)<\/body>/)
        const html = bodyMatch ? bodyMatch[1] : htmlContent

        return NextResponse.json({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          html,
          css,
          fullHtml: htmlContent
        })
      } catch (error) {
        console.error('Error reading template file:', error)
        return NextResponse.json(
          { error: 'Failed to load template' },
          { status: 500 }
        )
      }
    }

    // Return list of all templates
    return NextResponse.json({
      templates: TEMPLATES
    })
  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Save template (as Project for authenticated users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Sign in to save templates' },
        { status: 401 }
      )
    }
    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.slice(0, 256) : 'Untitled Template'
    const category = typeof body.category === 'string' ? body.category : 'General'
    const platform = typeof body.platform === 'string' ? body.platform : 'react'
    const codeContent = typeof body.codeContent === 'string' ? body.codeContent : ''
    const codeLanguage = typeof body.codeLanguage === 'string' ? body.codeLanguage : 'tsx'
    if (!codeContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'Code content is required' },
        { status: 400 }
      )
    }
    await prisma.project.create({
      data: {
        name,
        description: category,
        platform,
        generatedCode: codeContent,
        codeLanguage,
        userId: session.user.id,
      },
    })
    return NextResponse.json({ success: true, message: 'Template saved' }, { status: 200 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save template' },
      { status: 500 }
    )
  }
}
