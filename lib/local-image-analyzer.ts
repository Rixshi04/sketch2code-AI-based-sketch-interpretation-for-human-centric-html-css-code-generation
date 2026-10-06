export type LocalImageAnalysis = {
  layoutType: 'landing' | 'login' | 'dashboard' | 'gallery' | 'form'
  confidence: number
  description: string
  width?: number
  height?: number
}

function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

export function analyzeImageLocally(imageBase64: string): LocalImageAnalysis {
  try {
    const match = imageBase64.match(/^data:image\/[^;]+;base64,(.+)$/i)
    if (!match) throw new Error('Unsupported image data URL')
    const bytes = Uint8Array.from(Buffer.from(match[1], 'base64'))
    const size = readPngSize(bytes)
    const aspect = size ? size.width / Math.max(size.height, 1) : 1
    const layoutType = aspect > 1.45 ? 'landing' : aspect < 0.75 ? 'form' : 'landing'
    return {
      layoutType,
      confidence: size ? 0.35 : 0.15,
      description: size ? `Sketch image ${size.width}×${size.height}; visual layout requires provider analysis.` : 'Sketch image received; visual layout requires provider analysis.',
      width: size?.width,
      height: size?.height,
    }
  } catch {
    return {
      layoutType: 'landing',
      confidence: 0.1,
      description: 'Sketch image received; local visual analysis was inconclusive.',
    }
  }
}
