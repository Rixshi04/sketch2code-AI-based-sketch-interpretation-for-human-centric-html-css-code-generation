export function isOllamaEnabled(): boolean {
  return process.env.OLLAMA_ENABLED === 'true'
}

export async function ollamaGenerateCode(): Promise<string> {
  throw new Error('Ollama provider is enabled but no implementation is configured')
}
