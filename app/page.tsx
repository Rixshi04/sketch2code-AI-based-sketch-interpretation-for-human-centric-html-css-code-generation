'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Code, 
  Smartphone, 
  Monitor, 
  Palette, 
  CheckCircle,
  Sparkles,
  Download,
  Eye,
  Settings,
  User,
  Star,
  Share2,
  ArrowRight,
  Camera,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import CodeEditor from '@/components/CodeEditor'
import SketchUpload from '@/components/SketchUpload'
import PlatformSelector from '@/components/PlatformSelector'
import UXValidator from '@/components/UXValidator'
import PreviewPanel from '@/components/PreviewPanel'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState('react')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const steps = [
    { id: 1, title: 'Upload Sketch', icon: Upload },
    { id: 2, title: 'Select Platform', icon: Code },
    { id: 3, title: 'Generate Code', icon: Sparkles },
    { id: 4, title: 'UX Validation', icon: CheckCircle },
    { id: 5, title: 'Preview & Export', icon: Eye },
  ]

  const handleCodeGeneration = async () => {
    setIsGenerating(true)
    // Simulate AI code generation
    setTimeout(() => {
      setGeneratedCode(`import React from 'react';

const GeneratedComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to SketchMaster
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered UI Code Generation
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Cross-platform code generation</li>
              <li>• AI-powered UX validation</li>
              <li>• Interactive code editor</li>
              <li>• Real-time preview</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Supported Platforms</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span>React</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-green-600" />
                <span>Vue</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <span>Flutter</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
                <span>SwiftUI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedComponent;`)
      setIsGenerating(false)
      setCurrentStep(4)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">SketchMaster</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/opencv" className="btn-secondary flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>OpenCV AI</span>
              </Link>
              <Link href="/templates" className="btn-secondary flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Templates</span>
              </Link>
              <Link href="/auth/login" className="btn-secondary flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
              <Link href="/dashboard" className="btn-primary flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform Sketches into
              <span className="text-gradient"> Production Code</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload your UI sketches and get clean, modern code for React, Vue, Angular, Flutter, and SwiftUI. 
              Powered by AI with real-time preview and UX validation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/upload" className="btn-primary flex items-center space-x-2 text-lg px-8 py-4">
                <Upload className="w-5 h-5" />
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/opencv" className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                <Camera className="w-5 h-5" />
                <span>Try OpenCV AI</span>
                <Zap className="w-5 h-5" />
              </Link>
              <Link href="/templates" className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4">
                <Star className="w-5 h-5" />
                <span>Browse Templates</span>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">Advanced AI analyzes your sketches and generates production-ready code with best practices.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">UX Validation</h3>
              <p className="text-gray-600">Automated accessibility checks and design best practices validation for better user experience.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time OpenCV</h3>
              <p className="text-gray-600">Point your camera at sketches for instant UI element detection with computer vision intelligence.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Settings */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <SketchUpload 
                  onImageUpload={setUploadedImage}
                  onNext={() => setCurrentStep(2)}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <PlatformSelector
                  selectedPlatform={selectedPlatform}
                  onPlatformChange={setSelectedPlatform}
                  onNext={() => setCurrentStep(3)}
                />
              </motion.div>
            )}

            {currentStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Code Generation</h3>
                  <button
                    onClick={handleCodeGeneration}
                    disabled={isGenerating}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Code</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <UXValidator code={generatedCode} />
              </motion.div>
            )}
          </div>

          {/* Center Panel - Code Editor */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card h-[600px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generated Code</h3>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <CodeEditor 
                code={generatedCode}
                language={selectedPlatform === 'react' ? 'jsx' : 'tsx'}
                onChange={setGeneratedCode}
              />
            </motion.div>
          </div>
        </div>

        {/* Preview Panel */}
        {currentStep >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <PreviewPanel code={generatedCode} platform={selectedPlatform} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">SketchMaster</h3>
              </div>
              <p className="text-gray-400">
                Transform your sketches into production-ready code with AI-powered generation and validation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/templates" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
                <li><Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SketchMaster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 