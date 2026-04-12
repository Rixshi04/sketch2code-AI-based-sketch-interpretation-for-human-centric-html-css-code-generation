'use client'

import { useState, useRef, lazy, Suspense } from 'react'
import { Upload, Image, Camera, X, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Lazy load SampleSketches to avoid runtime errors
const SampleSketches = lazy(() => import('./SampleSketches'))

interface SketchUploadProps {
  onImageUpload: (imageUrl: string) => void
  onNext?: () => void
  selectedPlatform?: string
}

export default function SketchUpload({ onImageUpload, onNext, selectedPlatform }: SketchUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSampleSketches, setShowSampleSketches] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)
      onImageUpload(result)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleProcess = async () => {
    if (!uploadedImage) return
    
    setIsProcessing(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      toast.success('Sketch processed successfully!')
      onNext?.()
    }, 2000)
  }

  const removeImage = () => {
    setUploadedImage(null)
    onImageUpload('')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Your Sketch</h3>
        <p className="text-gray-600">
          Upload a sketch or wireframe to generate code
        </p>
      </div>

      {!uploadedImage ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop your sketch here
          </p>
          <p className="text-gray-500 mb-4">
            or click to browse files
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Image className="w-4 h-4" />
              <span>Upload Image</span>
            </button>
            <button 
              onClick={() => setShowSampleSketches(true)}
              className="btn-secondary flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>Use Sample Sketch</span>
            </button>
            <button className="btn-secondary flex items-center justify-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded sketch"
              className="w-full h-64 object-contain border border-gray-200 rounded-lg"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Sketch uploaded successfully
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="btn-primary flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Process Sketch</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tips for better results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use clear, high-contrast sketches</li>
          <li>• Include text labels for better understanding</li>
          <li>• Ensure good lighting and focus</li>
          <li>• Supported formats: JPG, PNG, GIF, SVG</li>
          <li>• Try our sample sketches to test code generation</li>
        </ul>
      </div>

      {/* Sample Sketches Modal */}
      {showSampleSketches && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            </div>
          </div>
        }>
          <SampleSketches
            onSelectSketch={(imageData) => {
              setUploadedImage(imageData)
              onImageUpload(imageData)
              setShowSampleSketches(false)
              toast.success('Sample sketch selected!')
            }}
            onClose={() => setShowSampleSketches(false)}
            selectedPlatform={selectedPlatform}
          />
        </Suspense>
      )}
    </div>
  )
} 