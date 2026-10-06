export function isHuggingFaceEnabled(): boolean {
  return Boolean(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_MODEL)
}

export async function huggingFaceGenerateCode(): Promise<string> {
  throw new Error('Hugging Face provider is enabled but no implementation is configured')
}
