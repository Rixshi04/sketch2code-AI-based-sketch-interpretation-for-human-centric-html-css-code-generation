'use client'

import { useState, useRef, useEffect, memo } from 'react'
import dynamic from 'next/dynamic'
import { Copy, Download, Sparkles, Lightbulb, Settings, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

// Lazy load Monaco Editor - it's a heavy library
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-white text-sm">Loading editor...</div>
    </div>
  ),
})

interface CodeEditorProps {
  code: string
  language: string
  platform?: string
  library?: string
  onChange: (value: string) => void
  onOptimize?: (optimizedCode: string) => void
}

interface CodeSuggestion {
  id: string
  type: 'completion' | 'optimization' | 'fix'
  message: string
  code: string
  line: number
  column: number
}

function CodeEditor({ 
  code, 
  language, 
  platform,
  library,
  onChange, 
  onOptimize 
}: CodeEditorProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const editorRef = useRef<any>(null)

  // AI Code Completion
  const generateSuggestions = async (currentCode: string) => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      const newSuggestions: CodeSuggestion[] = []
      
      // Platform-specific suggestions
      if (platform === 'react') {
        if (currentCode.includes('useState') && !currentCode.includes('useEffect')) {
          newSuggestions.push({
            id: 'react-useEffect',
            type: 'completion',
            message: 'Add useEffect for side effects',
            code: '\n  useEffect(() => {\n    // Add your side effects here\n  }, []);',
            line: currentCode.split('\n').length,
            column: 0
          })
        }
        
        if (currentCode.includes('onClick') && !currentCode.includes('useCallback')) {
          newSuggestions.push({
            id: 'react-useCallback',
            type: 'optimization',
            message: 'Optimize with useCallback',
            code: 'const handleClick = useCallback(() => {\n    // Your click handler\n  }, []);',
            line: 1,
            column: 0
          })
        }
      }
      
      // Library-specific suggestions
      if (library === 'mui') {
        if (currentCode.includes('Button') && !currentCode.includes('variant')) {
          newSuggestions.push({
            id: 'mui-button-variant',
            type: 'completion',
            message: 'Add button variant for better styling',
            code: 'variant="contained"',
            line: currentCode.split('\n').findIndex(line => line.includes('Button')) + 1,
            column: 0
          })
        }
      }
      
      // General code quality suggestions
      if (currentCode.includes('console.log')) {
        newSuggestions.push({
          id: 'remove-console',
          type: 'fix',
          message: 'Remove console.log for production',
          code: '',
          line: currentCode.split('\n').findIndex(line => line.includes('console.log')) + 1,
          column: 0
        })
      }
      
      setSuggestions(newSuggestions)
      setIsAnalyzing(false)
    }, 1500)
  }

  useEffect(() => {
    if (code && platform) {
      generateSuggestions(code)
    }
  }, [code, platform, library])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-component.${language === 'jsx' ? 'jsx' : 'tsx'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Code downloaded!')
  }

  const handleSuggestionApply = (suggestion: CodeSuggestion) => {
    const lines = code.split('\n')
    const newLines = [...lines]
    
    if (suggestion.type === 'fix') {
      // Remove the problematic line
      newLines.splice(suggestion.line - 1, 1)
    } else {
      // Insert the suggestion
      newLines.splice(suggestion.line, 0, suggestion.code)
    }
    
    const newCode = newLines.join('\n')
    onChange(newCode)
    toast.success('Suggestion applied!')
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Add custom completions
    editor.addCommand(editor.getModel()?.getValue() ? 0 : 0, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {})
    })
  }

  const getLanguageConfig = () => {
    switch (language) {
      case 'tsx':
      case 'jsx':
        return {
          language: 'typescript',
          theme: 'vs-dark',
          options: {
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on' as const,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on' as const,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showWords: true,
            }
          }
        }
      case 'vue':
        return {
          language: 'vue',
          theme: 'vs-dark',
          options: {
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on' as const,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on' as const,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
          }
        }
      default:
        return {
          language: language,
          theme: 'vs-dark',
          options: {
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on' as const,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on' as const,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
          }
        }
    }
  }

  const config = getLanguageConfig()

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            Language: {language.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {code.split('\n').length} lines
          </span>
          {platform && (
            <span className="text-sm text-gray-500">
              Platform: {platform}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{suggestions.length} Suggestions</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={config.language}
          value={code}
          onChange={(value) => onChange(value || '')}
          theme={config.theme}
          options={config.options}
          onMount={handleEditorDidMount}
        />
        
        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <h4 className="font-medium text-gray-900">AI Suggestions</h4>
              </div>
            </div>
            <div className="p-2">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      {suggestion.type === 'completion' && <Sparkles className="w-4 h-4 text-blue-500" />}
                      {suggestion.type === 'optimization' && <Zap className="w-4 h-4 text-yellow-500" />}
                      {suggestion.type === 'fix' && <Settings className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {suggestion.message}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Line {suggestion.line}
                      </p>
                      <button
                        onClick={() => handleSuggestionApply(suggestion)}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading Indicator */}
        {isAnalyzing && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(CodeEditor) 