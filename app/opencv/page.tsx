'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Camera, Brain, Target, Cpu } from 'lucide-react'
import Link from 'next/link'
import OpenCVSketchProcessor from '@/components/OpenCVSketchProcessor'

export default function SketchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-white">SketchMaster AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl mb-6 shadow-2xl"
            >
              <Camera className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-bold text-white mb-6">
              Real-time Sketch
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Intelligence</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Point your camera at any UI sketch and watch as our AI instantly detects buttons, inputs, text, 
              and other UI elements with real-time processing and intelligent analysis.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Detection</h3>
              <p className="text-gray-300">Advanced computer vision algorithms identify UI elements with high accuracy and confidence scores.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Processing</h3>
              <p className="text-gray-300">Live camera feed processing with instant element detection and bounding box visualization.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Analysis</h3>
              <p className="text-gray-300">Intelligent analysis of element properties including text, colors, sizes, and positioning.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sketch Processor Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <OpenCVSketchProcessor />
      </motion.div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-xl border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="inline-flex items-center space-x-2 mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">SketchMaster AI</h3>
            </motion.div>
            <p className="text-gray-400 mb-6">
              Powered by advanced computer vision and artificial intelligence
            </p>
            <div className="flex items-center justify-center space-x-6 text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 