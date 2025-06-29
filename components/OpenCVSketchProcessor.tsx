'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Download, 
  Settings, 
  Zap,
  Eye,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface DetectedElement {
  id: string
  type: 'button' | 'input' | 'text' | 'image' | 'container' | 'navigation'
  bounds: { x: number; y: number; width: number; height: number }
  confidence: number
  properties: {
    text?: string
    placeholder?: string
    color?: string
    size?: 'small' | 'medium' | 'large'
  }
}

interface ProcessingSettings {
  edgeThreshold: number
  contourThreshold: number
  blurRadius: number
  enableRealTime: boolean
  detectionSensitivity: number
}

export default function OpenCVSketchProcessor() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([])
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    edgeThreshold: 50,
    contourThreshold: 100,
    blurRadius: 3,
    enableRealTime: true,
    detectionSensitivity: 0.7
  })
  const [showSettings, setShowSettings] = useState(false)
  const [processingStats, setProcessingStats] = useState({
    fps: 0,
    elementsDetected: 0,
    processingTime: 0
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  // Initialize OpenCV (simulated for now - would need actual OpenCV.js integration)
  useEffect(() => {
    // In a real implementation, you would load OpenCV.js here
    // For now, we'll simulate the processing
    console.log('OpenCV Sketch Processor initialized')
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
        
        // Start real-time processing
        if (processingSettings.enableRealTime) {
          startRealTimeProcessing()
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }, [processingSettings.enableRealTime])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const startRealTimeProcessing = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const processFrame = () => {
      const startTime = performance.now()
      
      // Simulate OpenCV processing
      simulateOpenCVProcessing()
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      setProcessingStats(prev => ({
        fps: Math.round(1000 / processingTime),
        elementsDetected: detectedElements.length,
        processingTime: Math.round(processingTime)
      }))

      if (isCameraActive && processingSettings.enableRealTime) {
        animationFrameRef.current = requestAnimationFrame(processFrame)
      }
    }

    processFrame()
  }, [isCameraActive, processingSettings.enableRealTime, detectedElements.length])

  const simulateOpenCVProcessing = () => {
    // Simulate edge detection and contour analysis
    const mockElements: DetectedElement[] = [
      {
        id: '1',
        type: 'button',
        bounds: { x: 100, y: 200, width: 120, height: 40 },
        confidence: 0.92,
        properties: { text: 'Submit', color: '#3B82F6', size: 'medium' }
      },
      {
        id: '2',
        type: 'input',
        bounds: { x: 100, y: 150, width: 200, height: 35 },
        confidence: 0.88,
        properties: { placeholder: 'Enter text...', color: '#6B7280', size: 'medium' }
      },
      {
        id: '3',
        type: 'text',
        bounds: { x: 100, y: 100, width: 150, height: 25 },
        confidence: 0.95,
        properties: { text: 'Welcome', color: '#111827', size: 'large' }
      },
      {
        id: '4',
        type: 'navigation',
        bounds: { x: 0, y: 0, width: 400, height: 60 },
        confidence: 0.85,
        properties: { color: '#F3F4F6', size: 'large' }
      }
    ]

    setDetectedElements(mockElements)
  }

  const captureAndProcess = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    
    // Simulate processing delay
    setTimeout(() => {
      simulateOpenCVProcessing()
      setIsProcessing(false)
    }, 1500)
  }, [])

  const exportDetectedElements = useCallback(() => {
    const data = {
      elements: detectedElements,
      settings: processingSettings,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sketch-analysis-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [detectedElements, processingSettings])

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'button': return <Square className="w-4 h-4" />
      case 'input': return <Type className="w-4 h-4" />
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'navigation': return <Eye className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getElementColor = (type: string) => {
    switch (type) {
      case 'button': return 'text-blue-500'
      case 'input': return 'text-green-500'
      case 'text': return 'text-purple-500'
      case 'image': return 'text-orange-500'
      case 'navigation': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <Zap className="w-6 h-6" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">OpenCV Sketch Intelligence</h2>
                <p className="text-purple-100">Real-time UI element detection and analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportDetectedElements}
                disabled={detectedElements.length === 0}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Camera Feed and Controls */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              
              {/* Overlay for detected elements */}
              <div className="absolute inset-0 pointer-events-none">
                {detectedElements.map((element) => (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-green-400 bg-green-400/20 rounded"
                    style={{
                      left: `${element.bounds.x}px`,
                      top: `${element.bounds.y}px`,
                      width: `${element.bounds.width}px`,
                      height: `${element.bounds.height}px`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      {element.type} ({Math.round(element.confidence * 100)}%)
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={`p-3 rounded-full ${
                    isCameraActive 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white shadow-lg`}
                >
                  {isCameraActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={captureAndProcess}
                  disabled={!isCameraActive || isProcessing}
                  className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 rounded-full text-white shadow-lg"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{processingStats.fps}</div>
                <div className="text-sm text-gray-600">FPS</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{processingStats.elementsDetected}</div>
                <div className="text-sm text-gray-600">Elements</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{processingStats.processingTime}ms</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
            </div>
          </div>

          {/* Detected Elements Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detected Elements</h3>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">{detectedElements.length} elements found</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {detectedElements.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500"
                  >
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No elements detected yet</p>
                    <p className="text-sm">Point your camera at a UI sketch to start detection</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {detectedElements.map((element, index) => (
                      <motion.div
                        key={element.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gray-100 ${getElementColor(element.type)}`}>
                              {getElementIcon(element.type)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 capitalize">
                                {element.type}
                              </div>
                              <div className="text-sm text-gray-500">
                                Confidence: {Math.round(element.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {element.bounds.width} × {element.bounds.height}
                            </div>
                            <div className="text-xs text-gray-400">
                              ({element.bounds.x}, {element.bounds.y})
                            </div>
                          </div>
                        </div>
                        
                        {element.properties.text && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">Text:</span> {element.properties.text}
                          </div>
                        )}
                        
                        {element.properties.placeholder && (
                          <div className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">Placeholder:</span> {element.properties.placeholder}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 p-6 bg-gray-50"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edge Detection Threshold
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={processingSettings.edgeThreshold}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      edgeThreshold: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{processingSettings.edgeThreshold}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contour Threshold
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={processingSettings.contourThreshold}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      contourThreshold: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{processingSettings.contourThreshold}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blur Radius
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={processingSettings.blurRadius}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      blurRadius: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{processingSettings.blurRadius}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Sensitivity
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={processingSettings.detectionSensitivity}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      detectionSensitivity: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{processingSettings.detectionSensitivity}</div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="realTime"
                    checked={processingSettings.enableRealTime}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      enableRealTime: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="realTime" className="ml-2 text-sm text-gray-700">
                    Enable Real-time Processing
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
} 