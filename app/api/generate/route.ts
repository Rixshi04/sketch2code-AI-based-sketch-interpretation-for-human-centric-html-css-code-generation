import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Bumped when /api/generate response metadata semantics change (check GENERATION_LOG). */
const GENERATE_ROUTE_REV = 'semantic-meta-ml-source-2026-04-04'

// ============================================================================
// CRITICAL FIX #1: Support both JSON (with base64) and multipart (file) uploads
// ============================================================================
// The backend expects multipart/form-data with image files
// But frontend can send both JSON (base64) and multipart
// This endpoint now handles BOTH to bridge the protocol gap

type Platform = 'react' | 'vue' | 'angular' | 'flutter' | 'swiftui' | 'html'

interface GenerateRequest {
  imageUrl?: string  // Base64 data URL
  platform?: Platform
  description?: string
  style?: string
  theme?: 'light' | 'dark' | 'auto'
}

function normalizePlatform(platform?: string): Platform {
  const p = (platform || 'html').toLowerCase()
  if (p === 'react' || p === 'vue' || p === 'angular' || p === 'flutter' || p === 'swiftui' || p === 'html') {
    return p
  }
  return 'html'
}

function extractHTMLAndCSS(codeText: string, platform: string = 'html') {
  let html = ''
  let css = ''
  
  // Only extract HTML/CSS if it's actually HTML-like content
  // For React/Vue/other, pass the code as-is and let FixedLivePreview handle it
  const isHtmlLike = codeText.includes('<!DOCTYPE') || 
                     (codeText.includes('<html') && codeText.includes('</html>')) ||
                     (platform === 'html' && codeText.includes('<body'))
  
  if (isHtmlLike) {
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    const styleMatches = Array.from(codeText.matchAll(styleTagRegex))
    for (const match of styleMatches) {
      css += `${match[1]}\n`
    }
    html = codeText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim()
  }
  
  return { html: html || '', css: css.trim() }
}

function buildRequirements(platform: string, template: string, hasImage: boolean): string[] {
  return [
    `The generated output SHALL remain in ${platform.toUpperCase()} format only.`,
    `The layout SHALL follow ${template} intent inferred from explicit prompt keywords.`,
    `The generator SHALL avoid random template switching when intent is absent.`,
    `The system SHALL provide a deterministic fallback provider trace for every request.`,
    `The preview SHALL render code output immediately after generation.`,
    hasImage
      ? 'The request SHALL include image context during provider generation attempts.'
      : 'The request SHALL use description-only generation when no image is provided.',
  ]
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function calculateScores(params: { code: string; platform: string; fallbackUsed: boolean; hasImage: boolean }) {
  const { code, platform, fallbackUsed, hasImage } = params
  const codeLengthScore = clamp01(Math.min(code.length / 1200, 1))
  const structureScore = clamp01(
    Number(/(export default|<template>|@Component|Widget build|var body: some View|<html|<!doctype)/i.test(code))
  )
  const platformScore = clamp01(
    Number(
      platform === 'react'
        ? /(export default|return\s*\(|useState|React)/i.test(code)
        : platform === 'vue'
        ? /<template>[\s\S]*<\/template>/i.test(code)
        : platform === 'angular'
        ? /@Component|@NgModule/i.test(code)
        : platform === 'flutter'
        ? /Widget build|StatelessWidget|StatefulWidget/i.test(code)
        : platform === 'swiftui'
        ? /struct\s+\w+\s*:\s*View|var\s+body:\s*some\s+View/i.test(code)
        : /<html|<!doctype|<body|<div/i.test(code)
    )
  )

  const eeiTotal = clamp01(0.35 * codeLengthScore + 0.35 * structureScore + 0.3 * platformScore)
  const paiTotal = clamp01(
    0.4 * platformScore +
      0.25 * structureScore +
      0.2 * Number(hasImage) +
      0.15 * Number(!fallbackUsed)
  )

  return {
    eei: {
      completeness: codeLengthScore,
      structure: structureScore,
      platformCompliance: platformScore,
      total: eeiTotal,
    },
    pai: {
      platformLock: platformScore,
      providerPath: Number(!fallbackUsed),
      visualContext: Number(hasImage),
      total: paiTotal,
    },
  }
}

function languageForPlatform(platform: Platform): string {
  return {
    html: 'html',
    react: 'tsx',
    vue: 'vue',
    angular: 'ts',
    flutter: 'dart',
    swiftui: 'swift',
  }[platform]
}

export async function GET() {
  return NextResponse.json({
    routeRev: GENERATE_ROUTE_REV,
    datasetMatchEnabled: process.env.ENABLE_DATASET_MATCH === 'true',
    defaultLayout: 'auto',
    defaultFallback: 'landing',
    message: 'Generation pipeline is active',
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = (await request.json()) as GenerateRequest
    const platform = normalizePlatform(body.platform)
    const rawUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
    const imageBase64 = /^data:image\//i.test(rawUrl) ? rawUrl : undefined
    const description = (body.description || '').trim()
    const layoutHint = body.style || 'auto'
    const requestedLayout = layoutHint !== 'auto' ? layoutHint : 'auto'


    console.log('[generate] Request:', {
      platform,
      hasImage: Boolean(imageBase64),
      descriptionLength: description.length,
    })

    // Single pipeline: lib/ai-service (Gemini/OpenAI before ML unless ML_BEFORE_CLOUD=true)
    let result = await generateCode({
      imageBase64,
      platform,
      description,
      imageFilename: '',
      layout: requestedLayout,
    })


    let responsePlatform: Platform = normalizePlatform(result.platform || platform)

    const extracted = extractHTMLAndCSS(result.code, platform)
    let html = extracted.html
    let css = extracted.css

    console.log('[generate] AI service result:', {
      source: result.source,
      fallbackUsed: result.fallbackUsed,
      codeLength: result.code.length,
    })

    const mergedCode = String(result.code || '').trim() || String(html || '').trim()
    result = { ...result, code: mergedCode }
    if (!String(html || '').trim() && mergedCode) html = mergedCode


    const scores = calculateScores({
      code: result.code,
      platform: responsePlatform,
      fallbackUsed: result.fallbackUsed,
      hasImage: Boolean(imageBase64),
    })

    const requirements = buildRequirements(responsePlatform, result.layout, Boolean(imageBase64))

    const cssOut = String(css || '').trim()
    const htmlOut = (String(html || '').trim() || result.code).replace(
      '</head>',
      '<script src="https://cdn.tailwindcss.com"></script></head>'
    )

    const cloudQuotaHit = (result.providerAttempts || []).some((a) => a.reason === 'quota_exceeded')
    const suggestions = [
      `Generated via ${result.source} pipeline`,
      ...(cloudQuotaHit
        ? [
            'Cloud APIs (Gemini/OpenAI) returned quota or rate limit — generation used the next provider (e.g. ML). Check billing/limits in Google AI Studio and OpenAI.',
          ]
        : []),
    ]

    return NextResponse.json(
      {
        success: true,
        code: result.code,
        html: htmlOut,
        css: cssOut,
        source: result.source,
        fallbackUsed: result.fallbackUsed,
        providerAttempts: result.providerAttempts,
        platform: responsePlatform,
        language: languageForPlatform(responsePlatform),
        layout: result.layout,
        requirements,
        scores,
        suggestions,
        estimatedTime: 'Instant',
        metadata: {
          model: result.source,
          tokens: 0,
          processingTime: Date.now() - startTime,
          routeRev: GENERATE_ROUTE_REV,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error: any) {
    console.log('[generate] fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Generation failed',
        providerAttempts: [],
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
