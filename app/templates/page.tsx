'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/TemplateSelector'
import LivePreview from '@/components/LivePreview'
import { mergeGeneratedCodeWithTemplate } from '@/lib/template-utils'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<{ html: string; css: string; name: string } | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge' | 'insert'>('replace')
  const router = useRouter()

  useEffect(() => {
    // Check if there's generated code to merge
    const savedCode = sessionStorage.getItem('previewCode')
    if (savedCode) {
      setGeneratedCode(savedCode)
    }
  }, [])

  const handleTemplateSelect = (template: { html: string; css: string; name: string }) => {
    setSelectedTemplate(template)
    
    // If there's generated code, offer to merge
    if (generatedCode) {
      toast.success('Template selected! Choose merge option below.')
    }
  }

  const handleMerge = () => {
    if (!selectedTemplate || !generatedCode) {
      toast.error('Please select a template and ensure you have generated code')
      return
    }

    const merged = mergeGeneratedCodeWithTemplate(
      generatedCode,
      selectedTemplate.html,
      selectedTemplate.css,
      { mode: mergeMode }
    )

    // Store merged result
    sessionStorage.setItem('previewCode', merged.html)
    sessionStorage.setItem('previewCss', merged.css)
    sessionStorage.setItem('previewPlatform', 'html')

    toast.success('Template merged with generated code!')
    router.push('/preview')
  }

  const handleUseTemplateOnly = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first')
      return
    }

    // Store template for preview
    sessionStorage.setItem('previewCode', selectedTemplate.html)
    sessionStorage.setItem('previewCss', selectedTemplate.css)
    sessionStorage.setItem('previewPlatform', 'html')

    toast.success('Template loaded!')
    router.push('/preview')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Template Gallery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from professional templates or merge with your generated code
          </p>
        </div>

        {/* Template Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <TemplateSelector
            onSelect={handleTemplateSelect}
            showPreview={true}
          />
        </div>

        {/* Merge Options (if template and generated code both exist) */}
        {selectedTemplate && generatedCode && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Merge Template with Generated Code
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merge Mode
                </label>
                <select
                  value={mergeMode}
                  onChange={(e) => setMergeMode(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="replace">Replace Template (Use Generated Code Only)</option>
                  <option value="merge">Merge (Append Generated to Template)</option>
                  <option value="insert">Insert (Add Generated to Template Body)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMerge}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  Merge & Preview
                </button>
                <button
                  onClick={handleUseTemplateOnly}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                >
                  Use Template Only
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview of Selected Template */}
        {selectedTemplate && !generatedCode && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Preview: {selectedTemplate.name}
              </h2>
              <button
                onClick={handleUseTemplateOnly}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
              >
                Use This Template
              </button>
            </div>
            <LivePreview
              html={selectedTemplate.html}
              css={selectedTemplate.css}
              showControls={true}
              autoUpdate={true}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Professional Templates</h3>
            <p className="text-sm text-gray-600">
              Choose from carefully designed templates for different use cases
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🔀</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Merging</h3>
            <p className="text-sm text-gray-600">
              Merge your generated code with templates for the best of both worlds
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Preview</h3>
            <p className="text-sm text-gray-600">
              See your template in action before using it in your project
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
