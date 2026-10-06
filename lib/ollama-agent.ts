export type OllamaInput = { imageBase64?: string; platform: string; template: string; description: string }

export function isOllamaEnabled(): boolean {
  return process.env.OLLAMA_ENABLED === 'true'
}

export async function ollamaGenerateCode(_input: OllamaInput): Promise<string> {
  throw new Error('Ollama provider is enabled but no implementation is configured')
}
