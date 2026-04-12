'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle,
  Download,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Upload,
  Zap,
} from 'lucide-react'
import FixedLivePreview from './FixedLivePreview'

type ProcessingResult = {
  success: boolean
  html: string
  css: string
  js: string
  processing_time: number
  source: string
  used_ml: boolean
  message?: string
  error?: string
  details?: Record<string, unknown>
}

export default function OpenCVSketchProcessor() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Use FixedLivePreview's logic instead of local doc generation

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
      setIsCameraActive(true)
      setError('')
    } catch (cameraError) {
      console.error('Error accessing camera:', cameraError)
      setError('Camera access failed. You can still upload a sketch image instead.')
    }
  }, [])

  const readFilePreview = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      setSelectedFile(file)
      readFilePreview(file)
      setResult(null)
      setError('')
    },
    [readFilePreview]
  )

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const context = canvas.getContext('2d')
    if (!context) {
      setError('Could not capture camera frame.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) {
      setError('Could not convert captured frame into an image.')
      return
    }

    const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' })
    setSelectedFile(file)
    setImagePreview(canvas.toDataURL('image/png'))
    setResult(null)
    setError('')
  }, [])

  const processSketch = useCallback(async () => {
    if (!selectedFile) {
      setError('Upload a sketch or capture a frame first.')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('description', description.trim())
      formData.append('platform', 'html')

      const response = await fetch('/api/generate/ml', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as ProcessingResult
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Processing failed')
      }

      setResult(data)
    } catch (processingError) {
      console.error('OpenCV processing failed:', processingError)
      setResult(null)
      setError(processingError instanceof Error ? processingError.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }, [description, selectedFile])

  const exportResult = useCallback(() => {
    if (!result) return

    const payload = {
      fileName: selectedFile?.name || 'camera-capture.png',
      description,
      ...result,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `opencv-result-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [description, result, selectedFile])

  const resetAll = useCallback(() => {
    setSelectedFile(null)
    setImagePreview('')
    setDescription('')
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-sky-700 via-cyan-600 to-emerald-500 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">OpenCV Sketch Processor</h2>
                <p className="text-sm text-cyan-50">This panel now sends a real image to the backend instead of showing fake detections.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30"
              >
                <Upload className="h-4 w-4" />
                Upload Sketch
              </button>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30"
              >
                {isCameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {isCameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
              <button
                onClick={exportResult}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export Result
              </button>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full object-cover" />
              ) : imagePreview ? (
                <img src={imagePreview} alt="Selected sketch" className="h-72 w-full object-contain bg-slate-950" />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-lg font-medium">No sketch selected yet</p>
                  <p className="max-w-md text-sm text-slate-400">Upload a wireframe or turn on the camera and capture one frame for real backend processing.</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional: describe the sketch, like dashboard, login, pricing, gallery..."
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={captureFrame}
                disabled={!isCameraActive}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Camera className="h-4 w-4" />
                Capture Frame
              </button>
              <button
                onClick={processSketch}
                disabled={!selectedFile || isProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isProcessing ? 'Processing...' : 'Process Sketch'}
              </button>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Input</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{selectedFile ? selectedFile.name : 'No file'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{result?.source || 'Waiting'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time</div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {typeof result?.processing_time === 'number' ? `${result.processing_time}s` : '--'}
                </div>
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            ) : null}

            {result?.message ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle className="mt-0.5 h-5 w-5" />
                <p className="text-sm">{result.message}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Generated Preview</h3>
                  <p className="text-sm text-slate-500">Backend-rendered HTML/CSS output from the uploaded sketch.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result?.used_ml ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {result ? (result.used_ml ? 'ML backend' : 'Fallback output') : 'No result'}
                </span>
              </div>

              {result ? (
                <div className="h-[28rem] overflow-hidden rounded-xl border border-slate-200">
                  <FixedLivePreview 
                    code={result.html} 
                    css={result.css} 
                    platform="react" 
                    showControls={false}
                  />
                </div>
              ) : (
                <div className="flex h-[28rem] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Process a sketch to see the generated layout preview here.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Backend Notes</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>- This screen now uses the real backend route instead of mocked boxes.</p>
                <p>- For full OpenCV detection, the Python backend must be running with `opencv-python` installed.</p>
                <p>- If the backend is down, you will still get fallback HTML so the UI does not crash.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
