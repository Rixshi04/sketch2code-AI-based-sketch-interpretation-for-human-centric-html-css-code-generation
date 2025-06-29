import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CodeGenerationRequest {
  imageUrl: string
  platform: string
  description?: string
  style?: string
}

export interface CodeGenerationResponse {
  code: string
  language: string
  platform: string
  suggestions: string[]
  estimatedTime: string
}

export class AIService {
  static async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      const prompt = this.buildPrompt(request)
      
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert UI/UX developer and code generator. Your task is to analyze sketches and wireframes and generate clean, modern, and accessible code for the specified platform. Follow these guidelines:

1. Generate production-ready code with proper TypeScript/JavaScript syntax
2. Use modern frameworks and best practices for the target platform
3. Implement responsive design principles
4. Include proper accessibility features (ARIA labels, semantic HTML)
5. Use Tailwind CSS for styling when applicable
6. Follow component-based architecture
7. Include proper error handling and loading states
8. Optimize for performance and SEO
9. Use modern React hooks and patterns
10. Ensure cross-browser compatibility

Return only the code without explanations.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: request.imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      })

      const generatedCode = response.choices[0]?.message?.content || ''
      
      return {
        code: this.cleanCode(generatedCode),
        language: this.getLanguageForPlatform(request.platform),
        platform: request.platform,
        suggestions: this.generateSuggestions(request.platform),
        estimatedTime: this.estimateDevelopmentTime(request.platform)
      }
    } catch (error) {
      console.error('AI Code Generation Error:', error)
      throw new Error('Failed to generate code. Please try again.')
    }
  }

  private static buildPrompt(request: CodeGenerationRequest): string {
    const platformPrompts = {
      react: 'Generate a React component using TypeScript and Tailwind CSS. Include proper TypeScript interfaces, modern React hooks, and responsive design.',
      vue: 'Generate a Vue 3 component using Composition API and Tailwind CSS. Include proper TypeScript support and responsive design.',
      angular: 'Generate an Angular component using TypeScript and Tailwind CSS. Include proper Angular decorators, interfaces, and responsive design.',
      flutter: 'Generate a Flutter widget using Dart. Include proper widget structure, Material Design components, and responsive layout.',
      swiftui: 'Generate a SwiftUI view using Swift. Include proper view modifiers, state management, and iOS design patterns.'
    }

    const basePrompt = `Analyze this UI sketch and generate clean, modern code for ${request.platform.toUpperCase()}. 

Requirements:
- ${platformPrompts[request.platform as keyof typeof platformPrompts]}
- Make it fully responsive and mobile-friendly
- Include proper accessibility features
- Use modern design patterns and best practices
- Optimize for performance
- Include proper error handling

${request.description ? `Additional requirements: ${request.description}` : ''}
${request.style ? `Design style: ${request.style}` : ''}

Generate only the component code without any explanations or markdown formatting.`

    return basePrompt
  }

  private static cleanCode(code: string): string {
    // Remove markdown code blocks if present
    return code.replace(/```(jsx|tsx|javascript|typescript)?\n?/g, '').replace(/```\n?/g, '').trim()
  }

  private static getLanguageForPlatform(platform: string): string {
    const languageMap: Record<string, string> = {
      react: 'tsx',
      vue: 'vue',
      angular: 'ts',
      flutter: 'dart',
      swiftui: 'swift'
    }
    return languageMap[platform] || 'tsx'
  }

  private static generateSuggestions(platform: string): string[] {
    const suggestions: Record<string, string[]> = {
      react: [
        'Consider adding React Router for navigation',
        'Implement state management with Zustand or Redux',
        'Add loading states and error boundaries',
        'Use React Query for data fetching'
      ],
      vue: [
        'Consider using Pinia for state management',
        'Add Vue Router for navigation',
        'Implement composables for reusable logic',
        'Use VueUse for utility functions'
      ],
      angular: [
        'Consider using NgRx for state management',
        'Add Angular Router for navigation',
        'Implement services for data handling',
        'Use Angular Material for UI components'
      ],
      flutter: [
        'Consider using Provider or Riverpod for state management',
        'Add navigation with GoRouter',
        'Implement proper error handling',
        'Use Flutter Hooks for reactive programming'
      ],
      swiftui: [
        'Consider using @StateObject for state management',
        'Add navigation with NavigationView',
        'Implement proper error handling',
        'Use Combine for reactive programming'
      ]
    }
    return suggestions[platform] || []
  }

  private static estimateDevelopmentTime(platform: string): string {
    const timeEstimates: Record<string, string> = {
      react: '2-4 hours',
      vue: '2-4 hours',
      angular: '3-5 hours',
      flutter: '4-6 hours',
      swiftui: '3-5 hours'
    }
    return timeEstimates[platform] || '2-4 hours'
  }

  static async validateCode(code: string, platform: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a code reviewer and validator. Analyze the provided code for the ${platform} platform and provide feedback on:
1. Syntax errors
2. Best practices violations
3. Performance issues
4. Accessibility concerns
5. Security vulnerabilities
6. Code quality improvements

Return a JSON object with:
{
  "isValid": boolean,
  "errors": string[],
  "warnings": string[],
  "suggestions": string[]
}`
          },
          {
            role: "user",
            content: `Please validate this ${platform} code:\n\n${code}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      })

      const result = response.choices[0]?.message?.content || '{}'
      return JSON.parse(result)
    } catch (error) {
      console.error('Code Validation Error:', error)
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      }
    }
  }
} 