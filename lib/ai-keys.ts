export function getGeminiApiKeyFromEnv(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
}

export function getOpenAiApiKeyFromEnv(): string | undefined {
  return process.env.OPENAI_API_KEY
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKeyFromEnv())
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKeyFromEnv())
}
