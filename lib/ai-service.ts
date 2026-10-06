import OpenAI from 'openai'
import { LocalCodeGenerator } from './local-code-generator'
import { callMLGenerateCode } from './ml-backend-client'
import { analyzeImageLocally } from './local-image-analyzer'
import {
  getGeminiApiKeyFromEnv,
  getOpenAiApiKeyFromEnv,
  isGeminiConfigured,
  isOpenAiConfigured,
} from './ai-keys'
import { isOllamaEnabled, ollamaGenerateCode } from './ollama-agent'
import { isHuggingFaceEnabled, huggingFaceGenerateCode } from './huggingface-agent'

function getGeminiApiKey(): string | undefined {
  return getGeminiApiKeyFromEnv()
}

// Initialize OpenAI client only if API key is valid
function getOpenAIClient(): OpenAI | null {
  const apiKey = getOpenAiApiKeyFromEnv()
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

const openai = getOpenAIClient()

let geminiQuotaExceeded = false
let openaiQuotaExceeded = false

// Enable cloud providers when keys are present (GEMINI or GOOGLE_GEMINI_API_KEY; OpenAI via OPENAI_API_KEY)
const OPENAI_ENABLED = isOpenAiConfigured()
const GEMINI_ENABLED = isGeminiConfigured()

const PROVIDER_PRIORITY = ['ml', 'gemini', 'openai', 'ollama', 'huggingface', 'local'] as const
export type Provider = (typeof PROVIDER_PRIORITY)[number]

export interface ProviderAttempt {
  provider: Provider
  reason: string
  success: boolean
}

export interface GenerationResult {
  code: string
  source: Provider
  providerAttempts: { provider: Provider; reason: string }[]
  platform: string
  layout: string
  fallbackUsed: boolean
}

const TEMPLATE_DEFAULTS = {
  ENABLE_DATASET_MATCH: false,
  DEFAULT_LAYOUT: 'auto',
  DEFAULT_FALLBACK: 'landing',
} as const

function cleanGeneratedCode(code: string): string {
  return (code || '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim()
}

function mapToLocalLayout(template: string):
  | 'dashboard'
  | 'landing'
  | 'form'
  | 'gallery'
  | 'pricing'
  | 'login'
  | 'signup'
  | 'profile'
  | 'shop'
  | 'table'
  | 'wireframe' {
  if (template === 'wireframe') return 'wireframe'
  if (template === 'portal') return 'landing'
  if (template === 'login') return 'login'
  if (template === 'signup') return 'signup'
  if (template === 'profile') return 'profile'
  if (template === 'shop') return 'shop'
  if (template === 'table') return 'table'
  if (template === 'dashboard') return 'dashboard'
  return 'landing'
}

export function detectTemplate(description: string, imageFilename: string): string {
  const text = `${description || ''} ${imageFilename || ''}`.toLowerCase()
  const templates = [
    { name: 'login', keywords: ['login', 'signin', 'sign in', 'password', 'authenticate'] },
    { name: 'dashboard', keywords: ['dashboard', 'analytics', 'admin panel', 'metrics', 'stats'] },
    { name: 'landing', keywords: ['landing', 'hero', 'homepage', 'startup', 'saas', 'marketing'] },
    { name: 'signup', keywords: ['signup', 'register', 'create account', 'join', 'new user'] },
    { name: 'profile', keywords: ['profile', 'avatar', 'user page', 'account settings'] },
    { name: 'shop', keywords: ['shop', 'store', 'product', 'ecommerce', 'cart', 'buy'] },
    { name: 'table', keywords: ['table', 'list', 'records', 'data grid', 'crud'] },
    { name: 'portal', keywords: ['portal', 'service portal', 'infographic', 'services'] },
  ]

  for (const template of templates) {
    if (template.keywords.some((kw) => text.includes(kw))) {
      console.log(`[generate] Template detected: ${template.name}`)
      return template.name
    }
  }

  console.log('[generate] No template matched, using landing as default')
  return TEMPLATE_DEFAULTS.DEFAULT_FALLBACK
}

function isSpecificTemplate(template: string): boolean {
  return ['login', 'signup', 'dashboard', 'gallery', 'form', 'profile', 'shop', 'table', 'portal'].includes(template)
}

function isLockedIntentTemplate(template: string): boolean {
  return ['login', 'signup', 'dashboard', 'gallery', 'form', 'profile', 'shop', 'table', 'portal'].includes(template)
}

function getLocalTemplateHint(analysis: ReturnType<typeof analyzeImageLocally> | null): string {
  if (!analysis) return 'auto'
  // Lower threshold so gallery (0.64), form (0.67), landing (0.65), table (0.70) all pass through
  if (analysis.confidence >= 0.50) return analysis.layoutType
  return 'auto'
}

/** Only force login template when we are VERY confident the image is actually a login screen. */
function shouldUseSketchLoginTemplate(analysis: ReturnType<typeof analyzeImageLocally> | null): boolean {
  if (!analysis) return false
  // Require explicitly detected as login AND reasonable confidence (>= 0.75)
  return analysis.layoutType === 'login' && analysis.confidence >= 0.75
}

function shouldTrustMlTemplate(expectedTemplate: string, mlTemplate?: string, confidence = 0): boolean {
  if (isLockedIntentTemplate(expectedTemplate)) {
    if (!mlTemplate) return false
    if (mlTemplate === expectedTemplate) return true
    if (mlTemplate === 'form' && (expectedTemplate === 'login' || expectedTemplate === 'signup')) return confidence >= 0.78
    return false
  }
  if (!mlTemplate) return confidence >= 0.7
  if (mlTemplate === expectedTemplate) return true
  if (!isSpecificTemplate(expectedTemplate)) return confidence >= 0.7
  if (mlTemplate === 'form' && (expectedTemplate === 'login' || expectedTemplate === 'signup')) return confidence >= 0.72
  return false
}

function matchesExpectedStructure(code: string, expectedTemplate: string): boolean {
  const normalized = code.toLowerCase()
  if (expectedTemplate === 'login') {
    return normalized.includes('input') && normalized.includes('button')
  }
  if (expectedTemplate === 'form') {
    return normalized.includes('input') || normalized.includes('textarea') || normalized.includes('button')
  }
  if (expectedTemplate === 'dashboard') {
    return normalized.includes('sidebar') || normalized.includes('card') || normalized.includes('table')
  }
  if (expectedTemplate === 'gallery') {
    return normalized.includes('image') || normalized.includes('card')
  }
  return false
}

export function isValidPlatformOutput(code: string, platform: string): boolean {
  if (!code || code.trim().length < 100) return false

  const c = code.toLowerCase()
  switch (platform.toLowerCase()) {
    case 'react':
    case 'tsx':
    case 'jsx':
      return (
        c.includes('return (') ||
        c.includes('return(') ||
        c.includes('react') ||
        c.includes('usestate') ||
        c.includes('export default') ||
        (c.includes('const ') && c.includes('=> ('))
      )
    case 'vue':
      return c.includes('<template>') && c.includes('</template>')
    case 'angular':
      return c.includes('@component') || c.includes('@ngmodule')
    case 'flutter':
      return c.includes('widget build') || c.includes('statelesswidget') || c.includes('statefulwidget')
    case 'swiftui':
      return (c.includes('struct') && c.includes(': view')) || c.includes('var body: some view')
    case 'html':
    default:
      return c.includes('<html') || c.includes('<!doctype') || c.includes('<div') || c.includes('<body')
  }
}

export async function callWithPlatformRetry(
  callFn: () => Promise<string>,
  platform: string,
  description: string
): Promise<string | null> {
  let code = await callFn()
  if (!isValidPlatformOutput(code, platform)) {
    console.log(`[generate] Output invalid for ${platform}, retrying with explicit instruction`)
    const strictDescription = `
IMPORTANT: You MUST generate ONLY ${platform.toUpperCase()} code.
DO NOT generate HTML. DO NOT switch platforms.
${description}
`
    code = await (callFn as unknown as (strictDescription: string) => Promise<string>)(strictDescription)
  }
  return isValidPlatformOutput(code, platform) ? code : null
}

function normalizePlatform(platform: string): 'react' | 'vue' | 'angular' | 'flutter' | 'swiftui' | 'html' {
  const p = (platform || 'html').toLowerCase()
  if (p === 'react' || p === 'vue' || p === 'angular' || p === 'flutter' || p === 'swiftui' || p === 'html') {
    return p
  }
  return 'html'
}

function angularFallback(template: string, description: string): string {
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-generated',
  template: \
    \
    <div class="generated">
      <h1>${template[0].toUpperCase() + template.slice(1)} View</h1>
      <p>${description || 'Generated from local fallback pipeline.'}</p>
      <button>Primary Action</button>
    </div>
  \
})
export class GeneratedComponent {}`
}

function flutterFallback(template: string, description: string): string {
  return `import 'package:flutter/material.dart';

class GeneratedPage extends StatelessWidget {
  const GeneratedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${template[0].toUpperCase() + template.slice(1)} UI', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text('${description || 'Generated from local fallback pipeline.'}', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () {}, child: const Text('Primary Action')),
            ],
          ),
        ),
      ),
    );
  }
}`
}

function swiftUIFallback(template: string, description: string): string {
  return `import SwiftUI

struct GeneratedView: View {
  var body: some View {
    VStack(spacing: 16) {
      Text("${template[0].toUpperCase() + template.slice(1)} UI")
        .font(.largeTitle)
        .fontWeight(.bold)
      Text("${description || 'Generated from local fallback pipeline.'}")
        .multilineTextAlignment(.center)
      Button("Primary Action") {}
        .buttonStyle(.borderedProminent)
    }
    .padding()
  }
}`
}

function buildPrompt(platform: string, description: string, template: string, strict?: string, imageIncluded?: boolean): string {
  const strictBlock = strict || ''
  const vibe =
    platform.toLowerCase() === 'react' || platform.toLowerCase() === 'tsx'
      ? `
Design bar: premium SaaS / "vibe coder" UI — not a flat wireframe.
- Use at least one React hook (useState) for real interactivity: tabs, toggles, hover state, or a simple counter.
- Use modern styling: rounded-2xl, soft shadows, subtle gradients, clear typography (font-semibold headings), spacing scale.
- Buttons: gradient or solid brand, hover affordance; inputs: visible focus ring.
- Motion: CSS transition on hover/focus (transform/opacity) — no external animation libraries required.
- Keep semantic HTML (header/main/footer/nav) where appropriate.
`
      : ''

  const imageInstruction = imageIncluded
    ? `IMPORTANT: An image/sketch has been provided. You MUST analyze the visual layout in the image and generate code that FAITHFULLY reproduces what is shown. Do NOT default to a login page — look at what the image actually shows (it could be a dashboard, landing page, product page, gallery, form, profile, etc.) and replicate that layout.`
    : `No image provided — generate based on the description and template type below.`

  const templateHint = template && template !== 'auto'
    ? `Detected layout type (from image analysis): ${template}. Match this layout intent.`
    : `Infer the layout from the image or description.`

  return `You are SketchMaster, an expert UI code generator. Generate ONLY valid ${platform.toUpperCase()} code.

${imageInstruction}

${templateHint}
Description: ${description || 'No description provided'}
${vibe}
${strictBlock}
Return ONLY code. No markdown fences. No explanation. No comments outside the code.`
}

function extractBodyContent(markup: string): string {
  const bodyMatch = markup.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) return bodyMatch[1].trim()
  const htmlMatch = markup.match(/<html[^>]*>[\s\S]*?<\/html>/i)
  if (htmlMatch?.[0]) {
    return htmlMatch[0]
      .replace(/<!doctype[^>]*>/i, '')
      .replace(/<html[^>]*>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head[\s\S]*?<\/head>/i, '')
      .trim()
  }
  return markup.trim()
}

function extractStyleContent(markup: string): string {
  const styles: string[] = []
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match: RegExpExecArray | null = regex.exec(markup)

  while (match) {
    if (match[1]?.trim()) styles.push(match[1].trim())
    match = regex.exec(markup)
  }

  return styles.join('\n')
}

function convertHtmlToRequestedPlatform(code: string, platform: string): string {
  const content = extractBodyContent(code)
  const styles = extractStyleContent(code)

  if (platform === 'html') {
    if (/<html|<!doctype/i.test(code)) return code
    return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Generated Page</title></head><body>${content}</body></html>`
  }

  if (platform === 'react') {
    return `import React from 'react'

export default function GeneratedComponent() {
  return (
    <>
      ${styles ? `<style dangerouslySetInnerHTML={{ __html: ${JSON.stringify(styles)} }} />` : ''}
      <div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(content)} }} />
    </>
  )
}`
  }

  if (platform === 'vue') {
    return `<template>
  <div>
    <component :is="'style'" v-if="styles">{{ styles }}</component>
    <div v-html="markup"></div>
  </div>
</template>

<script setup>
const markup = ${JSON.stringify(content)}
const styles = ${JSON.stringify(styles)}
</script>`
  }

  if (platform === 'angular') {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-generated',
  template: ${JSON.stringify(content)},
  styles: [${JSON.stringify(styles)}]
})
export class GeneratedComponent {}`
  }

  if (platform === 'flutter') {
    return flutterFallback('generated', 'Generated from CUDA-local HTML inference.')
  }

  if (platform === 'swiftui') {
    return swiftUIFallback('generated', 'Generated from CUDA-local HTML inference.')
  }

  return code
}

async function callGemini(imageBase64: string | undefined, description: string, platform: string, template: string, strict?: string): Promise<string> {
  const key = getGeminiApiKey()
  if (!key) throw new Error('api key missing')
  const envModels = process.env.GEMINI_VISION_MODEL?.trim()
  const models = (envModels
    ? envModels.split(',')
    : ['gemini-2.0-flash', 'gemini-1.5-flash']
  )
    .map((m) => m.trim())
    .filter(Boolean)

  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: buildPrompt(platform, description, template, strict, Boolean(imageBase64)) },
  ]
  if (imageBase64 && imageBase64.startsWith('data:image/')) {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/i)
    if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } })
  }

  let lastErr: Error | null = null
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
      signal: AbortSignal.timeout(60000),
    })
    const json: any = await res.json()
    if (!res.ok || json?.error) {
      const msg = String(json?.error?.message || json?.error || '')
      const notFound = res.status === 404 || /not found|does not exist|invalid model/i.test(msg)
      if (notFound && models.length > 1) {
        lastErr = new Error(msg || `gemini error ${res.status}`)
        console.warn(`[generate] Gemini model ${model} unavailable, trying next`)
        continue
      }
      throw new Error(msg || `gemini error ${res.status}`)
    }
    return cleanGeneratedCode((json?.candidates?.[0]?.content?.parts || []).map((p: any) => p?.text || '').join(''))
  }
  throw lastErr || new Error('Gemini: no working model')
}

async function callOpenAI(imageBase64: string | undefined, description: string, platform: string, template: string, strict?: string): Promise<string> {
  const key = getOpenAiApiKeyFromEnv()
  if (!key) throw new Error('api key missing')

  const content: Array<any> = [{ type: 'text', text: buildPrompt(platform, description, template, strict, Boolean(imageBase64)) }]
  if (imageBase64 && imageBase64.startsWith('data:image/')) {
    content.push({ type: 'image_url', image_url: { url: imageBase64, detail: 'high' } })
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
      max_tokens: 2500,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000),
  })

  const json: any = await res.json()
  if (!res.ok || json?.error) {
    const err = new Error(json?.error?.message || `openai error ${res.status}`) as Error & { code?: string }
    err.code = json?.error?.code
    throw err
  }
  return cleanGeneratedCode(json?.choices?.[0]?.message?.content || '')
}

export function generateFromDescription(
  description: string,
  platform: string,
  imageFilename: string,
  forcedTemplate?: string
): string {
  const normalized = normalizePlatform(platform)
  const template = forcedTemplate && forcedTemplate !== 'auto' ? forcedTemplate : detectTemplate(description, imageFilename)

  if (normalized === 'react' || normalized === 'vue' || normalized === 'html') {
    return LocalCodeGenerator.generate({
      platform: normalized,
      layout: mapToLocalLayout(template),
      description: description || template,
      theme: 'light',
    })
  }

  if (normalized === 'angular') return angularFallback(template, description)
  if (normalized === 'flutter') return flutterFallback(template, description)
  return swiftUIFallback(template, description)
}

function categorizeError(e: any): string {
  const msg = e?.message?.toLowerCase() || ''
  const code = e?.code || ''
  const httpStatus = e?.status || 0
  // Distinguish hard quota exhaustion from temporary rate-limiting
  if (code === 'insufficient_quota' || msg.includes('insufficient_quota')) return 'quota_exceeded'
  if (msg.includes('quota') && !msg.includes('rate')) return 'quota_exceeded'
  if (msg.includes('rate limit') || msg.includes('rate_limit') || httpStatus === 429 || msg.includes('retry')) return 'rate_limited'
  if (msg.includes('api key') || msg.includes('invalid key') || msg.includes('unauthorized')) return 'invalid_api_key'
  if (msg.includes('not found') || msg.includes('model')) return 'model_not_found'
  if (msg.includes('timeout') || msg.includes('aborted')) return 'timeout'
  return 'unknown_error'
}

function buildResult(
  code: string,
  source: Provider,
  platform: string,
  template: string,
  attempts: ProviderAttempt[],
  fallbackUsed: boolean
): GenerationResult {
  return {
    code,
    source,
    platform,
    layout: template,
    providerAttempts: attempts.map((a) => ({ provider: a.provider, reason: a.reason })),
    fallbackUsed,
  }
}

export async function generateCode(params: {
  imageBase64?: string
  platform: string
  description?: string
  imageFilename?: string
  layout?: string
}): Promise<GenerationResult> {
  const {
    imageBase64,
    platform,
    description = '',
    imageFilename = '',
    layout = TEMPLATE_DEFAULTS.DEFAULT_LAYOUT,
  } = params
  const normalizedPlatform = normalizePlatform(platform)
  const localImageAnalysis = imageBase64 ? analyzeImageLocally(imageBase64) : null
  const explicitDescription = description.trim()
  const fallbackDescription = explicitDescription || localImageAnalysis?.description || ''
  const localTemplateHint = getLocalTemplateHint(localImageAnalysis)
  const detectedTemplate =
    layout !== 'auto' && layout
      ? layout
      : explicitDescription
        ? detectTemplate(explicitDescription, imageFilename)
        : localTemplateHint
  const providerDescription = [explicitDescription, detectedTemplate !== 'auto' ? `Template: ${detectedTemplate}` : '']
    .filter(Boolean)
    .join('\n')
  const fallbackTemplate =
    detectedTemplate !== 'auto'
      ? detectedTemplate
      : localTemplateHint !== 'auto'
        ? localTemplateHint
        : imageBase64
          ? (localImageAnalysis?.layoutType ?? 'landing')
          : TEMPLATE_DEFAULTS.DEFAULT_FALLBACK

  console.log(
    `[generate] Starting: platform=${normalizedPlatform} template=${detectedTemplate} hasImage=${Boolean(imageBase64)}`
  )

  const attempts: ProviderAttempt[] = []

  /** Default: cloud vision (Gemini/OpenAI) before local ML so API keys are actually used. Set ML_BEFORE_CLOUD=true to run OpenCV/ML pipeline first. */
  const mlBeforeCloud = process.env.ML_BEFORE_CLOUD === 'true'

  const tryGemini = async (): Promise<GenerationResult | null> => {
    if (GEMINI_ENABLED && !geminiQuotaExceeded && getGeminiApiKey()) {
      try {
        const code = await callWithPlatformRetry(
          (() => {
            let strictDescription = ''
            return ((override?: string) => {
              if (override) strictDescription = override
              return callGemini(
                imageBase64,
                providerDescription || fallbackDescription,
                normalizedPlatform,
                detectedTemplate,
                strictDescription
              )
            }) as unknown as () => Promise<string>
          })(),
          normalizedPlatform,
          explicitDescription || fallbackDescription
        )
        if (code && isValidPlatformOutput(code, normalizedPlatform)) {
          attempts.push({ provider: 'gemini', reason: 'success', success: true })
          console.log('[generate] Gemini succeeded')
          return buildResult(code, 'gemini', normalizedPlatform, detectedTemplate, attempts, false)
        }
        attempts.push({ provider: 'gemini', reason: 'invalid_output', success: false })
      } catch (e: any) {
        const reason = categorizeError(e)
        // Only permanently disable Gemini for hard quota exhaustion
        if (reason === 'quota_exceeded') geminiQuotaExceeded = true
        attempts.push({ provider: 'gemini', reason, success: false })
        console.log(`[generate] Gemini failed: ${reason} (${e?.message?.slice(0, 80) || ''})`)
      }
    } else {
      attempts.push({
        provider: 'gemini',
        reason: GEMINI_ENABLED ? (geminiQuotaExceeded ? 'quota_exceeded' : 'api_key_missing') : 'disabled',
        success: false,
      })
    }
    return null
  }

  const tryOpenai = async (): Promise<GenerationResult | null> => {
    if (OPENAI_ENABLED && !openaiQuotaExceeded && getOpenAiApiKeyFromEnv()) {
      try {
        const code = await callWithPlatformRetry(
          (() => {
            let strictDescription = ''
            return ((override?: string) => {
              if (override) strictDescription = override
              return callOpenAI(
                imageBase64,
                providerDescription || fallbackDescription,
                normalizedPlatform,
                detectedTemplate,
                strictDescription
              )
            }) as unknown as () => Promise<string>
          })(),
          normalizedPlatform,
          explicitDescription || fallbackDescription
        )
        if (code && isValidPlatformOutput(code, normalizedPlatform)) {
          attempts.push({ provider: 'openai', reason: 'success', success: true })
          console.log('[generate] OpenAI succeeded')
          return buildResult(code, 'openai', normalizedPlatform, detectedTemplate, attempts, false)
        }
        attempts.push({ provider: 'openai', reason: 'invalid_output', success: false })
      } catch (e: any) {
        const reason = categorizeError(e)
        // Only permanently disable OpenAI for hard quota exhaustion
        if (reason === 'quota_exceeded') openaiQuotaExceeded = true
        attempts.push({ provider: 'openai', reason, success: false })
        console.log(`[generate] OpenAI failed: ${reason} (${e?.message?.slice(0, 80) || ''})`)
      }
    } else {
      attempts.push({
        provider: 'openai',
        reason: OPENAI_ENABLED ? (openaiQuotaExceeded ? 'quota_exceeded' : 'api_key_missing') : 'disabled',
        success: false,
      })
    }
    return null
  }

  const tryOllama = async (): Promise<GenerationResult | null> => {
    if (!isOllamaEnabled()) {
      attempts.push({ provider: 'ollama', reason: 'disabled', success: false })
      return null
    }
    try {
      const code = await callWithPlatformRetry(
        (() => {
          let strictDescription = ''
          return ((override?: string) => {
            if (override) strictDescription = override
            return ollamaGenerateCode({
              imageBase64,
              platform: normalizedPlatform,
              template: String(detectedTemplate),
              description: strictDescription || providerDescription || fallbackDescription,
            })
          }) as unknown as () => Promise<string>
        })(),
        normalizedPlatform,
        explicitDescription || fallbackDescription
      )
      if (code && isValidPlatformOutput(code, normalizedPlatform)) {
        attempts.push({ provider: 'ollama', reason: 'success', success: true })
        console.log('[generate] Ollama (local agent) succeeded')
        return buildResult(code, 'ollama', normalizedPlatform, detectedTemplate, attempts, false)
      }
      attempts.push({ provider: 'ollama', reason: 'invalid_output', success: false })
    } catch (e: unknown) {
      const reason = categorizeError(e)
      attempts.push({ provider: 'ollama', reason, success: false })
      console.log('[generate] Ollama failed:', reason, (e as Error)?.message || e)
    }
    return null
  }

  const tryHuggingface = async (): Promise<GenerationResult | null> => {
    if (!isHuggingFaceEnabled()) {
      attempts.push({ provider: 'huggingface', reason: 'disabled', success: false })
      return null
    }
    try {
      const code = await callWithPlatformRetry(
        (() => {
          let strictDescription = ''
          return ((override?: string) => {
            if (override) strictDescription = override
            return huggingFaceGenerateCode({
              platform: normalizedPlatform,
              template: String(detectedTemplate),
              description: strictDescription || providerDescription || fallbackDescription,
              imageBase64,
            })
          }) as unknown as () => Promise<string>
        })(),
        normalizedPlatform,
        explicitDescription || fallbackDescription
      )
      if (code && isValidPlatformOutput(code, normalizedPlatform)) {
        attempts.push({ provider: 'huggingface', reason: 'success', success: true })
        console.log('[generate] Hugging Face Inference succeeded')
        return buildResult(code, 'huggingface', normalizedPlatform, detectedTemplate, attempts, false)
      }
      attempts.push({ provider: 'huggingface', reason: 'invalid_output', success: false })
    } catch (e: unknown) {
      const reason = categorizeError(e)
      attempts.push({ provider: 'huggingface', reason, success: false })
      console.log('[generate] Hugging Face failed:', reason, (e as Error)?.message || e)
    }
    return null
  }


  const tryMl = async (): Promise<GenerationResult | null> => {
    if (!imageBase64) return null
    try {
      const mlResult = await callMLGenerateCode({
        imageBase64,
        platform: normalizedPlatform,
        description: providerDescription || fallbackDescription,
      })
      if (mlResult?.code) {
        let code = cleanGeneratedCode(mlResult.code)
        if (
          normalizedPlatform === 'react' &&
          (code.includes('<!DOCTYPE') || (code.includes('<html') && code.includes('</html>')))
        ) {
          code = convertHtmlToRequestedPlatform(code, 'react')
        }
        if (isValidPlatformOutput(code, normalizedPlatform)) {
          attempts.push({ provider: 'ml', reason: 'success', success: true })
          console.log('[generate] ML backend (FastAPI) succeeded')
          const layoutForUi =
            mlResult.layout != null
              ? typeof mlResult.layout === 'string'
                ? mlResult.layout
                : JSON.stringify(mlResult.layout)
              : String(mlResult.template ?? fallbackTemplate)
          return buildResult(code, 'ml', normalizedPlatform, layoutForUi, attempts, false)
        }
        attempts.push({ provider: 'ml', reason: 'invalid_output', success: false })
        console.log('[generate] ML backend returned code that failed platform validation')
      } else {
        attempts.push({ provider: 'ml', reason: 'unreachable_or_empty', success: false })
        console.log('[generate] ML backend unreachable or empty response (is it running on :8000?)')
      }
    } catch (e: unknown) {
      const reason = categorizeError(e)
      attempts.push({ provider: 'ml', reason, success: false })
      console.log('[generate] ML backend error:', reason, (e as Error)?.message || e)
    }
    return null
  }

  const order = mlBeforeCloud
    ? [tryMl, tryGemini, tryOpenai, tryOllama, tryHuggingface]
    : [tryGemini, tryOpenai, tryOllama, tryHuggingface, tryMl]

  for (const run of order) {
    const out = await run()
    if (out) return out
  }

  console.log('[generate] Using local generator')
  const sketchLogin = shouldUseSketchLoginTemplate(localImageAnalysis)
  const effectiveLocalTemplate = sketchLogin ? 'login' : fallbackTemplate
  const localCode = generateFromDescription(
    fallbackDescription,
    normalizedPlatform,
    imageFilename,
    effectiveLocalTemplate
  )
  const deterministicFromSketch = Boolean(imageBase64) && sketchLogin
  const localReason = !deterministicFromSketch
    ? 'fallback'
    : localImageAnalysis?.layoutType === 'login'
      ? 'semantic_login_template'
      : 'image_inferred_form'
  attempts.push({ provider: 'local', reason: localReason, success: true })
  return buildResult(
    localCode,
    'local',
    normalizedPlatform,
    sketchLogin ? 'login' : fallbackTemplate,
    attempts,
    !deterministicFromSketch
  )
}

// ML backend (/api/generate-code) is called with auth from lib/ml-backend-client.ts
// and used by app/api/generate/route.ts and lib/ai-service-failsafe.ts.

// Local AI Service Integration
const LOCAL_AI_URL = process.env.LOCAL_AI_URL || process.env.NEXT_PUBLIC_LOCAL_AI_URL || 'http://127.0.0.1:8000'

async function checkLocalAIHealth(): Promise<{ status: string; model_loaded: boolean; device: string } | null> {
  try {
    const response = await fetch(`${LOCAL_AI_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function generateWithLocalAI(prompt: string, options?: {
  max_length?: number
  temperature?: number
}): Promise<{ code: string; model: string } | null> {
  try {
    const response = await fetch(`${LOCAL_AI_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        num_return_sequences: 1,
        ...options,
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!response.ok) return null
    const result = await response.json()
    return { code: result.code, model: result.model }
  } catch {
    return null
  }
}

export interface CodeGenerationRequest {
  imageUrl: string
  platform: SupportedPlatform
  library?: string
  description?: string
  style?: string
  theme?: 'light' | 'dark' | 'auto'
  complexity?: 'simple' | 'medium' | 'complex'
  accessibility?: boolean
  responsive?: boolean
  useLocalAI?: boolean  // Use local AI model instead of cloud
}

export interface CodeGenerationResponse {
  code: string
  language: string
  platform: string
  suggestions: string[]
  estimatedTime: string
  metadata: {
    model: string
    tokens: number
    processingTime: number
    confidence: number
  }
}

export type SupportedPlatform = 'react' | 'vue' | 'angular' | 'flutter' | 'swiftui'

// Model configurations for different use cases
const MODEL_CONFIGS = {
  // Best for complex UI generation with high accuracy
  'gpt-4-vision-preview': {
    maxTokens: 4000,
    temperature: 0.2,
    detail: 'high' as const,
    cost: 'high'
  },
  // Good balance of speed and quality
  'gpt-4o': {
    maxTokens: 4000,
    temperature: 0.3,
    detail: 'high' as const,
    cost: 'medium'
  },
  // Fastest but lower quality
  'gpt-4o-mini': {
    maxTokens: 4000,
    temperature: 0.4,
    detail: 'low' as const,
    cost: 'low'
  }
}

export class AIService {
  static async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    const startTime = Date.now()
    
    // Check if local AI should be used
    if (request.useLocalAI) {
      return this.generateCodeWithLocalAI(request)
    }
    
    if (!openai) {
      throw new Error('OpenAI API key is not configured')
    }
    
    try {
      // Select appropriate model based on complexity and requirements
      const modelConfig = this.selectModel(request)
      
      // Build comprehensive prompt
      const prompt = this.buildComprehensivePrompt(request)
      
      // Generate code with selected model
      const response = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request)
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: request.imageUrl,
                  detail: modelConfig.detail
                } 
              }
            ]
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      })

      const generatedCode = response.choices[0]?.message?.content || ''
      const tokens = response.usage?.total_tokens || 0
      const processingTime = Date.now() - startTime

      return {
        code: this.cleanCode(generatedCode),
        language: this.getLanguageForPlatform(request.platform),
        platform: request.platform,
        suggestions: this.generateSuggestions(request),
        estimatedTime: this.estimateDevelopmentTime(request),
        metadata: {
          model: modelConfig.model,
          tokens,
          processingTime,
          confidence: this.calculateConfidence(request, generatedCode)
        }
      }
    } catch (error) {
      console.error('AI Code Generation Error:', error)
      throw new Error('Failed to generate code. Please try again.')
    }
  }

  // Generate code using local AI model
  static async generateCodeWithLocalAI(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    const startTime = Date.now()
    
    // Check local AI health
    const health = await checkLocalAIHealth()
    if (!health || !health.model_loaded) {
      throw new Error('Local AI model is not available. Please ensure the local AI server is running and the model is trained.')
    }
    
    // Build prompt for local AI (text-based, no image support yet)
    const prompt = this.buildLocalAIPrompt(request)
    
    // Generate with local AI
    const result = await generateWithLocalAI(prompt, {
      max_length: 512,
      temperature: 0.7
    })
    
    if (!result) {
      throw new Error('Local AI generation failed. Please check the server logs.')
    }
    
    const processingTime = Date.now() - startTime
    
    return {
      code: this.cleanCode(result.code),
      language: this.getLanguageForPlatform(request.platform),
      platform: request.platform,
      suggestions: this.generateSuggestions(request),
      estimatedTime: this.estimateDevelopmentTime(request),
      metadata: {
        model: result.model,
        tokens: 0, // Local AI doesn't track tokens
        processingTime,
        confidence: 0.7 // Default confidence for local AI
      }
    }
  }

  // Build prompt for local AI (text-based description)
  private static buildLocalAIPrompt(request: CodeGenerationRequest): string {
    let prompt = `Generate ${request.platform} code for a ${request.style || 'component'}. `
    
    if (request.description) {
      prompt += `Description: ${request.description}. `
    }
    
    prompt += `Platform: ${request.platform}. `
    
    if (request.library) {
      prompt += `Use ${request.library} library. `
    }
    
    if (request.theme && request.theme !== 'auto') {
      prompt += `Theme: ${request.theme}. `
    }
    
    if (request.accessibility) {
      prompt += `Include accessibility features. `
    }
    
    if (request.responsive) {
      prompt += `Make it responsive. `
    }
    
    prompt += `Generate clean, production-ready code.`
    
    return prompt
  }

  private static selectModel(request: CodeGenerationRequest) {
    const complexity = request.complexity || 'medium'
    
    switch (complexity) {
      case 'complex':
        return { ...MODEL_CONFIGS['gpt-4-vision-preview'], model: 'gpt-4-vision-preview' }
      case 'medium':
        return { ...MODEL_CONFIGS['gpt-4o'], model: 'gpt-4o' }
      case 'simple':
        return { ...MODEL_CONFIGS['gpt-4o-mini'], model: 'gpt-4o-mini' }
      default:
        return { ...MODEL_CONFIGS['gpt-4o'], model: 'gpt-4o' }
    }
  }

  // Multi-provider ensemble: OpenAI, Gemini, Mistral, Llama (via OpenRouter)
  static async generateCodeEnsemble(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    const startTime = Date.now()

    const tasks: Array<Promise<{ provider: string; model: string; code: string }>> = []

    // OpenAI – skip if quota exceeded (don't wait again)
    if (openai && !openaiQuotaExceeded) {
      tasks.push(
        (async () => {
          try {
            const model = 'gpt-4o'
            const response = await openai.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: this.getSystemPrompt(request) },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: this.buildComprehensivePrompt(request) },
                    { type: 'image_url', image_url: { url: request.imageUrl, detail: 'high' } }
                  ]
                }
              ],
              max_tokens: 4000,
              temperature: 0.3
            })
            const code = this.cleanCode(response.choices[0]?.message?.content || '')
            if (!code || code.trim().length < 10) {
              throw new Error('OpenAI returned empty code')
            }
            return { provider: 'openai', model, code }
          } catch (error: unknown) {
            const err = error as { code?: string }
            if (err?.code === 'insufficient_quota') {
              openaiQuotaExceeded = true
              console.log('OpenAI quota exceeded, skipping')
              return { provider: 'openai', model: '', code: '' }
            }
            console.error('OpenAI generation error:', error)
            return { provider: 'openai', model: '', code: '' }
          }
        })()
      )
    } else {
      console.warn('OpenAI API key not configured or invalid')
    }

    // Google Gemini (supports both GEMINI_API_KEY and GOOGLE_GEMINI_API_KEY)
    const geminiKey =
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
        ? process.env.GEMINI_API_KEY
        : process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your_gemini_api_key_here'
        ? process.env.GOOGLE_GEMINI_API_KEY
        : undefined

    if (geminiKey && geminiKey.length > 10 && !geminiQuotaExceeded) {
      tasks.push(
        (async () => {
          try {
          const model = 'gemini-2.0-flash'
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

          const isDataUrl = typeof request.imageUrl === 'string' && request.imageUrl.startsWith('data:image/')
          const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
            { text: this.getSystemPrompt(request) + '\n\n' + this.buildComprehensivePrompt(request) + '\n\nReturn ONLY the code.' }
          ]

          if (isDataUrl) {
            try {
              const match = request.imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
              if (match) {
                const mime = match[1]
                const data = match[2]
                parts.push({ inline_data: { mime_type: mime, data } })
              } else {
                // Fallback to including the URL as text if parsing fails
                parts.push({ text: `Image URL: ${request.imageUrl}` })
              }
            } catch {
              parts.push({ text: `Image URL: ${request.imageUrl}` })
            }
          } else if (request.imageUrl) {
            // Gemini file API is preferred for remote URLs; include URL in context as fallback
            parts.push({ text: `Image URL: ${request.imageUrl}` })
          }

          const body = { contents: [{ role: 'user', parts }] }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
          })
          const json: any = await res.json()

            if (json?.error?.code === 429 || json?.error?.message?.toLowerCase?.().includes('quota') || json?.error?.message?.toLowerCase?.().includes('rate limit')) {
              geminiQuotaExceeded = true
              console.log('Gemini quota exceeded, skipping')
              return { provider: 'gemini', model: '', code: '' }
            }

          const code = this.cleanCode(
            (json?.candidates?.[0]?.content?.parts || [])
              .map((p: any) => (typeof p.text === 'string' ? p.text : ''))
              .join('') || ''
          )

          if (!code || code.trim().length < 10) {
            return { provider: 'gemini', model: '', code: '' }
          }
          return { provider: 'gemini', model, code }
        } catch (geminiErr) {
          geminiQuotaExceeded = true
          console.log('Gemini quota exceeded, skipping')
          return { provider: 'gemini', model: '', code: '' }
        }
        })()
      )
    }

    // Mistral (Codestral / Large)
    if (process.env.MISTRAL_API_KEY) {
      tasks.push(
        (async () => {
          const model = 'mistral-large-latest'
          const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: this.getSystemPrompt(request) },
                { role: 'user', content: this.buildComprehensivePrompt(request) + '\n\nReturn ONLY the code.' }
              ],
              temperature: 0.3,
              max_tokens: 4000
            }),
            // Prevent hanging requests
            signal: AbortSignal.timeout(60000),
          })
          const json: any = await res.json()
          const code = this.cleanCode(json?.choices?.[0]?.message?.content || '')
          return { provider: 'mistral', model, code }
        })()
      )
    }

    // Llama via OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      tasks.push(
        (async () => {
          const model = 'meta-llama/llama-3.1-70b-instruct'
          const res = await fetch('https://api.openrouter.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: this.getSystemPrompt(request) },
                { role: 'user', content: this.buildComprehensivePrompt(request) + '\n\nReturn ONLY the code.' }
              ],
              temperature: 0.3,
              max_tokens: 4000
            }),
            // Prevent hanging requests
            signal: AbortSignal.timeout(60000),
          })
          const json: any = await res.json()
          const code = this.cleanCode(json?.choices?.[0]?.message?.content || '')
          return { provider: 'openrouter', model, code }
        })()
      )
    }

    if (tasks.length === 0) {
      // No AI providers configured - use description-based local generator (never generic)
      console.warn('No AI providers configured. Using description-based local generator.')
      const { LocalCodeGenerator } = await import('./local-code-generator')
      const plat = (request as { platform?: string }).platform
      const fallbackCode = LocalCodeGenerator.generate({
        platform: plat === 'vue' ? 'vue' : plat === 'html' ? 'html' : 'react',
        description: request.description || 'modern UI with form and buttons',
        theme: request.theme === 'dark' ? 'dark' : 'light',
      })
      return {
        code: fallbackCode,
        language: this.getLanguageForPlatform(request.platform),
        platform: request.platform,
        suggestions: [
          '⚠️ No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_GEMINI_API_KEY in your .env file',
          'Get OpenAI API key: https://platform.openai.com/api-keys',
          'Get Gemini API key: https://makersuite.google.com/app/apikey',
          'After adding the key, restart your development server'
        ],
        estimatedTime: '5-10 minutes',
        metadata: {
          model: 'fallback',
          tokens: 0,
          processingTime: 100,
          confidence: 0.3
        }
      }
    }

    const results = await Promise.allSettled(tasks)

    // Score and select best (skip empty code e.g. OpenAI quota exceeded)
    let best: { provider: string; model: string; code: string; score: number } | null = null
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { provider, model, code } = r.value
        if (!code || code.trim().length < 10) continue
        const score = this.calculateConfidence(request, code)
        if (!best || score > best.score) {
          best = { provider, model, code, score }
        }
      }
    }

    if (!best) {
      throw new Error('All AI providers failed')
    }

    const processingTime = Date.now() - startTime
    return {
      code: this.cleanCode(best.code),
      language: this.getLanguageForPlatform(request.platform),
      platform: request.platform,
      suggestions: this.generateSuggestions(request),
      estimatedTime: this.estimateDevelopmentTime(request),
      metadata: {
        model: best.model,
        tokens: 0,
        processingTime,
        confidence: best.score
      }
    }
  }

  private static getSystemPrompt(request: CodeGenerationRequest): string {
    const basePrompt = `You are an expert UI/UX developer and code generator specializing in ${request.platform.toUpperCase()}. Your task is to analyze sketches and wireframes and generate production-ready, clean, modern, and accessible code.

CRITICAL REQUIREMENTS:
1. Generate ONLY the component code - no explanations, no markdown formatting
2. Use modern ${request.platform} best practices and patterns
3. Implement responsive design principles
4. Include proper accessibility features (ARIA labels, semantic HTML, keyboard navigation)
5. Use TypeScript for type safety
6. Follow component-based architecture
7. Include proper error handling and loading states
8. Optimize for performance and SEO
9. Ensure cross-browser compatibility
10. Use modern styling approaches (Tailwind CSS, CSS-in-JS, or platform-specific styling)`

    const platformSpecific = this.getPlatformSpecificGuidelines(request.platform)
    const accessibilityGuidelines = request.accessibility ? this.getAccessibilityGuidelines() : ''
    const responsiveGuidelines = request.responsive ? this.getResponsiveGuidelines() : ''

    return `${basePrompt}

${platformSpecific}
${accessibilityGuidelines}
${responsiveGuidelines}

IMPORTANT: Return ONLY the code. No explanations, no markdown, no comments about the code.`
  }

  private static getPlatformSpecificGuidelines(platform: SupportedPlatform): string {
    const guidelines = {
      react: `
REACT SPECIFIC GUIDELINES:
- Use functional components with hooks
- Implement proper state management (useState, useEffect, useContext)
- Use TypeScript interfaces for props and state
- Include proper prop validation
- Use modern React patterns (custom hooks, compound components)
- Implement proper error boundaries
- Use React.memo for performance optimization when needed`,

      vue: `
VUE SPECIFIC GUIDELINES:
- Use Vue 3 Composition API
- Implement proper TypeScript support
- Use reactive() and ref() for state management
- Include proper prop validation with defineProps
- Use computed properties for derived state
- Implement proper error handling
- Use Vue Router for navigation if needed`,

      angular: `
ANGULAR SPECIFIC GUIDELINES:
- Use Angular 17+ with standalone components
- Implement proper TypeScript interfaces
- Use Angular Material or other UI libraries
- Include proper dependency injection
- Use Angular forms (Reactive or Template-driven)
- Implement proper error handling with error interceptors
- Use Angular Router for navigation`,

      flutter: `
FLUTTER SPECIFIC GUIDELINES:
- Use modern Flutter patterns (StatelessWidget, StatefulWidget)
- Implement proper state management (Provider, Riverpod, or Bloc)
- Use Material Design 3 components
- Include proper error handling
- Implement responsive design with MediaQuery
- Use proper widget composition
- Include proper accessibility features`,

      swiftui: `
SWIFTUI SPECIFIC GUIDELINES:
- Use modern SwiftUI patterns (@State, @Binding, @StateObject)
- Implement proper state management
- Use SF Symbols for icons
- Include proper accessibility features
- Implement responsive design
- Use proper view modifiers
- Follow iOS Human Interface Guidelines`
    }

    return guidelines[platform] || guidelines.react
  }

  private static getAccessibilityGuidelines(): string {
    return `
ACCESSIBILITY GUIDELINES (WCAG 2.1 AA):
- Include proper ARIA labels and roles
- Ensure proper color contrast ratios (4.5:1 minimum)
- Implement keyboard navigation support
- Use semantic HTML elements
- Include alt text for images
- Ensure focus indicators are visible
- Support screen readers
- Implement proper heading hierarchy
- Use proper form labels and descriptions`
  }

  private static getResponsiveGuidelines(): string {
    return `
RESPONSIVE DESIGN GUIDELINES:
- Implement mobile-first approach
- Use flexible layouts (Flexbox, Grid, or platform equivalents)
- Ensure proper breakpoints for different screen sizes
- Optimize touch targets (minimum 44px)
- Handle different device orientations
- Use appropriate font sizes and spacing
- Implement proper viewport meta tags`
  }

  private static buildComprehensivePrompt(request: CodeGenerationRequest): string {
    const platformPrompt = this.buildPlatformPrompt(request)
    const stylePrompt = this.buildStylePrompt(request)
    const libraryPrompt = this.buildLibraryPrompt(request)
    
    let prompt = `Analyze this UI sketch and generate clean, modern code for ${request.platform.toUpperCase()}.

REQUIREMENTS:
${platformPrompt}
${stylePrompt}
${libraryPrompt}`

    if (request.description) {
      prompt += `\n\nADDITIONAL CONTEXT: ${request.description}`
    }

    if (request.complexity) {
      prompt += `\n\nCOMPLEXITY LEVEL: ${request.complexity.toUpperCase()}`
    }

    prompt += `\n\nReturn ONLY the component code. No explanations or markdown formatting.`
    
    return prompt
  }

  private static buildPlatformPrompt(request: CodeGenerationRequest): string {
    const basePrompts = {
      react: 'Generate a React component using TypeScript and modern React patterns. Include proper TypeScript interfaces, React hooks, and responsive design.',
      vue: 'Generate a Vue 3 component using Composition API and TypeScript. Include proper TypeScript support, reactive state, and responsive design.',
      angular: 'Generate an Angular component using TypeScript and modern Angular patterns. Include proper decorators, interfaces, and responsive design.',
      flutter: 'Generate a Flutter widget using Dart and modern Flutter patterns. Include proper widget structure, state management, and responsive layout.',
      swiftui: 'Generate a SwiftUI view using Swift and modern iOS patterns. Include proper view modifiers, state management, and iOS design guidelines.'
    }

    return basePrompts[request.platform] || basePrompts.react
  }

  private static buildStylePrompt(request: CodeGenerationRequest): string {
    let stylePrompt = ''
    
    if (request.style) {
      stylePrompt += `\nSTYLE: ${request.style}`
    }
    
    if (request.theme && request.theme !== 'auto') {
      stylePrompt += `\nTHEME: ${request.theme} theme`
    }
    
    return stylePrompt
  }

  private static buildLibraryPrompt(request: CodeGenerationRequest): string {
    if (!request.library || request.library === 'none') {
      return ''
    }

    const libraryPrompts = {
      // React libraries
      mui: 'Use Material-UI (MUI) components and follow Material Design principles.',
      chakra: 'Use Chakra UI components and follow their design system.',
      antd: 'Use Ant Design components and follow their design patterns.',
      tailwind: 'Use Tailwind CSS utility classes for styling.',
      bootstrap: 'Use React Bootstrap components and follow Bootstrap design patterns.',
      
      // Vue libraries
      vuetify: 'Use Vuetify components and follow Material Design principles.',
      element: 'Use Element Plus components and follow their design system.',
      quasar: 'Use Quasar components and follow their design patterns.',
      
      // Angular libraries
      material: 'Use Angular Material components and follow Material Design principles.',
      primeng: 'Use PrimeNG components and follow their design patterns.',
      ngzorro: 'Use NG-ZORRO components and follow Ant Design patterns.',
      
      // Flutter libraries
      cupertino: 'Use Cupertino components for iOS-style design.',
      fluent: 'Use Fluent Design components for Windows-style design.',
      
      // SwiftUI libraries
      'sf-symbols': 'Use SF Symbols for icons and follow Apple design guidelines.',
      'swiftui-charts': 'Use SwiftUI Charts for data visualization.'
    }

    return `\nUI LIBRARY: ${libraryPrompts[request.library as keyof typeof libraryPrompts] || ''}`
  }

  private static cleanCode(code: string): string {
    return code
      .replace(/```[\s\S]*?\n/g, '') // Remove opening markdown block
      .replace(/```/g, '') // Remove closing markdown block
      .replace(/^[\s\n]+/, '') // Remove leading whitespace
      .replace(/[\s\n]+$/, '') // Remove trailing whitespace
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
  }

  private static getLanguageForPlatform(platform: SupportedPlatform): string {
    const languageMap: Record<SupportedPlatform, string> = {
      react: 'tsx',
      vue: 'vue',
      angular: 'ts',
      flutter: 'dart',
      swiftui: 'swift'
    }
    return languageMap[platform]
  }

  private static generateSuggestions(request: CodeGenerationRequest): string[] {
    const baseSuggestions = {
      react: [
        'Consider adding React Router for navigation',
        'Implement state management with Zustand or Redux Toolkit',
        'Add loading states and error boundaries',
        'Use React Query for data fetching',
        'Consider using Framer Motion for animations'
      ],
      vue: [
        'Consider using Pinia for state management',
        'Add Vue Router for navigation',
        'Implement composables for reusable logic',
        'Use VueUse for utility functions',
        'Consider using Vue Transition for animations'
      ],
      angular: [
        'Consider using NgRx for state management',
        'Add Angular Router for navigation',
        'Implement services for data handling',
        'Use Angular Material for UI components',
        'Consider using Angular Animations'
      ],
      flutter: [
        'Consider using Provider or Riverpod for state management',
        'Add navigation with GoRouter',
        'Implement proper error handling',
        'Use Flutter Hooks for reactive programming',
        'Consider using Flutter Animation for smooth transitions'
      ],
      swiftui: [
        'Consider using @StateObject for state management',
        'Add navigation with NavigationView',
        'Implement proper error handling',
        'Use Combine for reactive programming',
        'Consider using SwiftUI Animation for smooth transitions'
      ]
    }

    const suggestions = baseSuggestions[request.platform] || baseSuggestions.react

    // Add platform-specific suggestions
    if (request.accessibility) {
      suggestions.push('Test with screen readers and keyboard navigation')
    }

    if (request.responsive) {
      suggestions.push('Test on different screen sizes and orientations')
    }

    return suggestions
  }

  private static generateFallbackCode(request: CodeGenerationRequest): string {
    const platform = request.platform
    
    switch (platform) {
      case 'react':
        return `// Generated React component (Fallback - Configure AI API key for real generation)
import React from 'react';

const GeneratedComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Generated Component</h1>
        <p className="text-gray-600 mb-6">
          This is a fallback component. Configure an AI provider API key to generate real code based on your uploaded image.
        </p>
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Primary Action
          </button>
          <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
            Secondary Action
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedComponent;`
      
      case 'vue':
        return `<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Generated Component</h1>
      <p class="text-gray-600 mb-6">
        This is a fallback component. Configure an AI provider API key to generate real code.
      </p>
      <div class="space-y-4">
        <button class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Primary Action
        </button>
        <button class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
          Secondary Action
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Generated Vue component (Fallback)
</script>`
      
      case 'angular':
        return `import { Component } from '@angular/core';

@Component({
  selector: 'app-generated',
  template: \`
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Generated Component</h1>
        <p class="text-gray-600 mb-6">
          This is a fallback component. Configure an AI provider API key to generate real code.
        </p>
        <div class="space-y-4">
          <button class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Primary Action
          </button>
          <button class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
            Secondary Action
          </button>
        </div>
      </div>
    </div>
  \`
})
export class GeneratedComponent {
  // Generated Angular component (Fallback)
}`
      
      case 'flutter':
        return `import 'package:flutter/material.dart';

class GeneratedComponent extends StatelessWidget {
  const GeneratedComponent({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.blue.shade50, Colors.indigo.shade100],
          ),
        ),
        child: Center(
          child: Container(
            margin: EdgeInsets.all(16),
            padding: EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Generated Component',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade900,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'This is a fallback component. Configure an AI provider API key to generate real code.',
                  style: TextStyle(color: Colors.grey.shade600),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {},
                  child: Text('Primary Action'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 48),
                  ),
                ),
                SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () {},
                  child: Text('Secondary Action'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 48),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}`
      
      case 'swiftui':
        return `import SwiftUI

struct GeneratedComponent: View {
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.indigo.opacity(0.1)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 24) {
                Text("Generated Component")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
                
                Text("This is a fallback component. Configure an AI provider API key to generate real code.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                VStack(spacing: 12) {
                    Button("Primary Action") {
                        // Action
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                    
                    Button("Secondary Action") {
                        // Action
                    }
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(radius: 10)
            .padding()
        }
    }
}

struct GeneratedComponent_Previews: PreviewProvider {
    static var previews: some View {
        GeneratedComponent()
    }
}`
      
      default:
        return `// Generated component (Fallback - Configure AI API key for real generation)
// Platform: ${platform}
// This is a placeholder component. Please configure an AI provider API key.`
    }
  }

  private static estimateDevelopmentTime(request: CodeGenerationRequest): string {
    const baseTime = {
      simple: { react: '1-2 hours', vue: '1-2 hours', angular: '2-3 hours', flutter: '2-3 hours', swiftui: '2-3 hours' },
      medium: { react: '2-4 hours', vue: '2-4 hours', angular: '3-5 hours', flutter: '4-6 hours', swiftui: '3-5 hours' },
      complex: { react: '4-8 hours', vue: '4-8 hours', angular: '6-10 hours', flutter: '8-12 hours', swiftui: '6-10 hours' }
    }

    const complexity = request.complexity || 'medium'
    const platformTimes = baseTime[complexity]
    
    return platformTimes[request.platform] || platformTimes.react
  }

  private static calculateConfidence(request: CodeGenerationRequest, generatedCode: string): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on code quality indicators
    if (generatedCode.includes('interface') || generatedCode.includes('type')) confidence += 0.1
    if (generatedCode.includes('useState') || generatedCode.includes('ref') || generatedCode.includes('@State')) confidence += 0.1
    if (generatedCode.includes('className') || generatedCode.includes('style')) confidence += 0.1
    if (generatedCode.includes('aria-') || generatedCode.includes('role')) confidence += 0.1

    // Decrease confidence for potential issues
    if (generatedCode.length < 100) confidence -= 0.2
    if (generatedCode.includes('TODO') || generatedCode.includes('FIXME')) confidence -= 0.1
    if (generatedCode.includes('console.log')) confidence -= 0.05

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Advanced code generation with multiple models
  static async generateCodeAdvanced(request: CodeGenerationRequest): Promise<CodeGenerationResponse[]> {
    const models = ['gpt-4-vision-preview', 'gpt-4o', 'gpt-4o-mini']
    const results: CodeGenerationResponse[] = []

    for (const model of models) {
      try {
        const result = await this.generateCodeWithModel(request, model)
        results.push(result)
      } catch (error) {
        console.error(`Error generating code with ${model}:`, error)
      }
    }

    return results
  }

  private static async generateCodeWithModel(request: CodeGenerationRequest, model: string): Promise<CodeGenerationResponse> {
    const startTime = Date.now()
    
    if (!openai) {
      throw new Error('OpenAI API key is not configured')
    }
    
    const response = await openai.chat.completions.create({
      model,
        messages: [
          {
            role: 'system',
          content: this.getSystemPrompt(request)
          },
          {
            role: 'user',
          content: [
            { type: 'text', text: this.buildComprehensivePrompt(request) },
            { 
              type: 'image_url', 
              image_url: { 
                url: request.imageUrl,
                detail: model.includes('vision') ? 'high' : 'low'
              } 
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    })

    const generatedCode = response.choices[0]?.message?.content || ''
    const tokens = response.usage?.total_tokens || 0
    const processingTime = Date.now() - startTime

        return {
      code: this.cleanCode(generatedCode),
      language: this.getLanguageForPlatform(request.platform),
      platform: request.platform,
      suggestions: this.generateSuggestions(request),
      estimatedTime: this.estimateDevelopmentTime(request),
      metadata: {
        model,
        tokens,
        processingTime,
        confidence: this.calculateConfidence(request, generatedCode)
      }
    }
  }
}
