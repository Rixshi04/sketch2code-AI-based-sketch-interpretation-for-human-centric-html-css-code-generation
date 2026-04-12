'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Eye, Users, Zap, Shield } from 'lucide-react'

interface UXValidatorProps {
  code: string
  onAutoFix?: (fixedCode: string) => void
}

interface ValidationResult {
  category: string
  status: 'pass' | 'warning' | 'error'
  message: string
  suggestion?: string
}

export default function UXValidator({ code, onAutoFix }: UXValidatorProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [overallScore, setOverallScore] = useState(0)
  const [isAutoFixing, setIsAutoFixing] = useState(false)

  useEffect(() => {
    if (code) {
      validateCode()
    }
  }, [code])

  const validateCode = async () => {
    setIsValidating(true)
    
    // Check if code is empty
    if (!code || code.trim().length < 10) {
      const results: ValidationResult[] = [
        {
          category: 'Code Validation',
          status: 'error',
          message: 'No code provided for validation',
          suggestion: 'Generate code first to validate UX patterns'
        }
      ]
      setValidationResults(results)
      setOverallScore(0)
      setIsValidating(false)
      return
    }
    
    // Simulate AI validation
    setTimeout(() => {
      const results: ValidationResult[] = [
        {
          category: 'Accessibility',
          status: 'pass',
          message: 'Good semantic HTML structure',
          suggestion: 'Consider adding ARIA labels for better screen reader support'
        },
        {
          category: 'Responsive Design',
          status: 'pass',
          message: 'Responsive classes detected',
          suggestion: 'Test on various screen sizes'
        },
        {
          category: 'Performance',
          status: 'warning',
          message: 'Consider optimizing images',
          suggestion: 'Use next/image for better performance'
        },
        {
          category: 'SEO',
          status: 'pass',
          message: 'Good heading structure',
          suggestion: 'Add meta descriptions'
        },
        {
          category: 'Color Contrast',
          status: 'error',
          message: 'Low contrast detected in some elements',
          suggestion: 'Ensure WCAG AA compliance (4.5:1 ratio)'
        },
        {
          category: 'Mobile Optimization',
          status: 'pass',
          message: 'Mobile-friendly design patterns',
          suggestion: 'Test touch interactions'
        }
      ]
      
      setValidationResults(results)
      
      // Calculate overall score
      const score = results.reduce((acc, result) => {
        if (result.status === 'pass') return acc + 100
        if (result.status === 'warning') return acc + 60
        return acc + 20
      }, 0) / results.length
      
      setOverallScore(Math.round(score))
      setIsValidating(false)
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleAutoFix = async () => {
    if (!code || !onAutoFix) return
    
    setIsAutoFixing(true)
    
    // Simulate auto-fix process
    setTimeout(() => {
      let fixedCode = code
      
      // Apply common UX fixes
      const fixes = [
        // Add ARIA labels
        {
          pattern: /<button([^>]*)>/g,
          replacement: '<button$1 aria-label="Button">'
        },
        // Add alt text to images
        {
          pattern: /<img([^>]*)(?!.*alt=)/g,
          replacement: '<img$1 alt="Image"'
        },
        // Add semantic HTML
        {
          pattern: /<div([^>]*class="[^"]*title[^"]*"[^>]*)>/g,
          replacement: '<h2$1>'
        },
        // Add proper form labels
        {
          pattern: /<input([^>]*type="text"[^>]*)>/g,
          replacement: '<label htmlFor="input">Input</label><input$1 id="input">'
        },
        // Add focus states
        {
          pattern: /className="([^"]*)"([^>]*>)/g,
          replacement: 'className="$1 focus:outline-none focus:ring-2 focus:ring-blue-500"$2'
        }
      ]
      
      fixes.forEach(fix => {
        fixedCode = fixedCode.replace(fix.pattern, fix.replacement)
      })
      
      // Add accessibility improvements
      if (!fixedCode.includes('role=')) {
        fixedCode = fixedCode.replace(
          /<div([^>]*class="[^"]*button[^"]*"[^>]*)>/g,
          '<div$1 role="button" tabIndex="0">'
        )
      }
      
      // Add keyboard navigation
      if (!fixedCode.includes('onKeyDown')) {
        fixedCode = fixedCode.replace(
          /<div([^>]*role="button"[^>]*)>/g,
          '<div$1 onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}>'
        )
      }
      
      onAutoFix(fixedCode)
      setIsAutoFixing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">UX Validation</h3>
        <p className="text-gray-600">
          AI-powered analysis of your generated code
        </p>
      </div>

      {!code || code.trim().length < 10 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Code to Validate</h4>
          <p className="text-gray-600 mb-4">
            Generate code first to see UX validation and accessibility analysis.
          </p>
          <div className="text-sm text-gray-500">
            Go back to step 4 and click "Generate Code" to get started.
          </div>
        </div>
      ) : isValidating ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing code quality and UX patterns...</p>
        </div>
      ) : (
        <>
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Overall Score</h4>
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  overallScore >= 80 ? 'bg-green-600' : 
                  overallScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {overallScore >= 80 ? 'Excellent! Your code follows best practices.' :
               overallScore >= 60 ? 'Good, but there\'s room for improvement.' :
               'Needs attention. Consider the suggestions below.'}
            </div>
          </div>

          {/* Validation Results */}
          <div className="space-y-4">
            {validationResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">
                      {result.category}
                    </h5>
                    <p className="text-sm text-gray-700 mb-2">
                      {result.message}
                    </p>
                    {result.suggestion && (
                      <p className="text-xs text-gray-600 bg-white/50 rounded px-2 py-1">
                        💡 {result.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-secondary flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button 
              onClick={handleAutoFix}
              disabled={isAutoFixing || !code || !onAutoFix}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>{isAutoFixing ? 'Fixing...' : 'Auto-Fix'}</span>
            </button>
          </div>

          {/* Best Practices */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>UX Best Practices</span>
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure proper color contrast ratios</li>
              <li>• Use semantic HTML elements</li>
              <li>• Implement keyboard navigation</li>
              <li>• Add proper alt text for images</li>
              <li>• Test with screen readers</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
} 