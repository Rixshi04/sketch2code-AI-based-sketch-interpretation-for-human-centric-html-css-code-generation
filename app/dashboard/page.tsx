'use client'

import Header from '@/components/Header'
import type { PlatformSelectorProps } from '@/components/PlatformSelector'
import type { LivePreviewPanelProps } from '@/components/LivePreviewPanel'
import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Code, Play, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface GeneratedCode {
  code: string
  language: string
  platform: string
  suggestions: string[]
  estimatedTime: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

const PlatformSelector = dynamic<PlatformSelectorProps>(
  () => import('@/components/PlatformSelector'),
  {
    ssr: false,
    loading: () => <PlatformSelectorSkeleton />,
  }
)

const LivePreviewPanel = dynamic<LivePreviewPanelProps>(
  () => import('@/components/LivePreviewPanel'),
  {
    ssr: false,
    loading: () => <LivePreviewSkeleton />,
  }
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

function PlatformSelectorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="h-full w-full bg-gray-100 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function LivePreviewSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-6">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-48 w-full bg-gray-100 rounded-lg animate-pulse" />
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState('react')
  const [selectedLibrary, setSelectedLibrary] = useState('none')
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [codeOutput, setCodeOutput] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null
  }

  // Handle image upload with proper validation
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }, [])

  // Generate code using AI
  const handleGenerate = async () => {
    if (!imageFile || !prompt.trim()) {
      setError('Please upload an image and provide a description')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setGeneratedCode(null)
    setValidation(null)

    try {
      // Convert image to base64 for API
      const base64Image = await fileToBase64(imageFile)
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64Image,
          platform: selectedPlatform,
          library: selectedLibrary,
          description: prompt,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      
      if (data.code) {
        setGeneratedCode({
          code: data.code,
          language: data.language || 'tsx',
          platform: data.platform,
          suggestions: data.suggestions || [],
          estimatedTime: data.estimatedTime || '2-4 hours'
        })
        setSuccess('Code generated successfully!')
      } else {
        setError(data.error || 'Failed to generate code')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Execute code
  const handleRun = async () => {
    if (!generatedCode?.code) return

    setLoading(true)
    setError('')
    setCodeOutput('')

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: generatedCode.code,
          platform: generatedCode.platform 
        }),
      })

      const data = await res.json()
      setCodeOutput(data.result || data.error)
    } catch (err) {
      setError('Failed to execute code')
    } finally {
      setLoading(false)
    }
  }

  // Save as template
  const handleSaveTemplate = async () => {
    if (!generatedCode?.code) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prompt.slice(0, 32) || 'Untitled Template',
          category: 'General',
          platform: selectedPlatform,
          codeContent: generatedCode.code,
          codeLanguage: generatedCode.language,
        }),
      })

      if (res.ok) {
        setSuccess('Template saved successfully!')
      } else {
        setError('Failed to save template')
      }
    } catch (err) {
      setError('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  // Validate code
  const handleValidate = async () => {
    if (!generatedCode?.code) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/generation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: generatedCode.code,
          platform: generatedCode.platform 
        }),
      })

      const data = await res.json()
      setValidation(data)
    } catch (err) {
      setError('Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Dashboard" />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Upload Design Section */}
          <motion.section
            className="card glass-effect"
            variants={cardVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Upload Your Design</h2>
            </div>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  aria-describedby="upload-help"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative inline-block"
                >
                  <img
                    src={imagePreview}
                    alt="Design preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    <span className="sr-only">Remove</span>
                    ×
                  </button>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* Prompt and Platform Section */}
          <motion.section
            className="card glass-effect"
            variants={cardVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Describe Your Requirements</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the UI or functionality you want to generate..."
                  rows={3}
                  className="input-field resize-none"
                  aria-describedby="prompt-help"
                />
                <p id="prompt-help" className="mt-1 text-sm text-gray-500">
                  Be specific about layout, features, and design preferences
                </p>
              </div>

              <PlatformSelector
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                selectedLibrary={selectedLibrary}
                onLibraryChange={setSelectedLibrary}
                onNext={() => {
                  // Platform selection is complete, ready to generate code
                  if (imageFile && prompt.trim()) {
                    handleGenerate();
                  }
                }}
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || !imageFile}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Generate Code
                  </>
                )}
              </button>
            </div>
          </motion.section>

          {/* Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-green-700">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Code Section */}
          {generatedCode && (
            <motion.section
              className="card glass-effect"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Code className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Generated Code</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{generatedCode.language.toUpperCase()}</span>
                  <span>•</span>
                  <span>{generatedCode.estimatedTime}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="editor-container">
                  <textarea
                    value={generatedCode.code}
                    onChange={(e) => setGeneratedCode(prev => prev ? { ...prev, code: e.target.value } : null)}
                    rows={12}
                    className="w-full font-mono text-sm p-4 bg-gray-900 text-gray-100 border-0 focus:outline-none resize-none"
                    placeholder="Generated code will appear here..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRun}
                    disabled={!generatedCode.code || loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Run Code
                  </button>
                  
                  <button
                    onClick={handleValidate}
                    disabled={!generatedCode.code || loading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Validate
                  </button>
                  
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!generatedCode.code || loading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                </div>

                {/* Code Output */}
                {codeOutput && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Output:</h3>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {codeOutput}
                    </pre>
                  </div>
                )}

                {/* Validation Results */}
                {validation && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Validation Results:</h3>
                    
                    {validation.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {validation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {validation.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.suggestions.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Suggestions:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {validation.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Suggestions */}
                {generatedCode.suggestions.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">AI Suggestions:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {generatedCode.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Live Preview Section */}
          {generatedCode && (
            <motion.section
              className="card glass-effect"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-800">Live Preview</h2>
              </div>
              
              <LivePreviewPanel code={generatedCode.code} />
            </motion.section>
          )}
        </div>
      </motion.div>
    </>
  )
} 