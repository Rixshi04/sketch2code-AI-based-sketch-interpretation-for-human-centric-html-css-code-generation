import { getMlBackendUrl } from './ml-backend-url'

export type MlGenerateCodeInput = {
  imageBase64: string
  platform?: string
  description?: string
}

export type MlGenerateCodeResult = {
  code?: string
  css?: string
  layout?: unknown
  template?: string
  analysis?: Record<string, unknown>
  platform?: string
  description?: string
  processing_time?: number
  error?: string
  detail?: string
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) throw new Error('Image must be a valid base64 data URL')
  const mime = match[1]
  const binary = Buffer.from(match[2], 'base64')
  return new Blob([binary], { type: mime })
}

export async function callMLGenerateCode(input: MlGenerateCodeInput): Promise<MlGenerateCodeResult> {
  const platform = (input.platform || 'html').toLowerCase()

  if (platform !== 'react') {
    throw new Error('ML backend currently supports React generation only')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.ML_BACKEND_TIMEOUT_MS || 30000))

  try {
    const form = new FormData()
    form.append('file', dataUrlToBlob(input.imageBase64), 'sketch.png')
    form.append('description', input.description || '')
    form.append('platform', 'react')

    const response = await fetch(getMlBackendUrl() + '/api/generate-code', {
      method: 'POST',
      body: form,
      signal: controller.signal,
      cache: 'no-store',
    })

    const payload = (await response.json().catch(() => ({}))) as MlGenerateCodeResult
    if (!response.ok || payload.error) {
      throw new Error(payload.detail || payload.error || ('ML backend returned HTTP ' + response.status))
    }
    if (!payload.code?.trim()) {
      throw new Error('ML backend returned no generated code')
    }
    return payload
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('ML backend request timed out')
    }
    throw error instanceof Error ? error : new Error('ML backend request failed')
  } finally {
    clearTimeout(timeout)
  }
}
