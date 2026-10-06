export type HuggingFaceInput = { imageBase64?: string; platform: string; template: string; description: string }

export function isHuggingFaceEnabled(): boolean {
  return Boolean(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_MODEL)
}

export async function huggingFaceGenerateCode(_input: HuggingFaceInput): Promise<string> {
  throw new Error('Hugging Face provider is enabled but no implementation is configured')
}
