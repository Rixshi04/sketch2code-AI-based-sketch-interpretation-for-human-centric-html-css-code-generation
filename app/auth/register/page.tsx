'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Chrome,
  Apple,
  Github,
  Sparkles,
  Zap,
  Shield,
  Users
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Apple-style scroll animations
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, -200])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])

  // Floating animation values
  const floatingY = useMotionValue(0)
  const floatingYSpring = useSpring(floatingY, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const interval = setInterval(() => {
      floatingY.set(Math.sin(Date.now() * 0.001) * 10)
    }, 16)
    return () => clearInterval(interval)
  }, [floatingY])

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!')
      setIsLoading(false)
      return
    }
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Account created!')
      window.location.href = '/dashboard'
    }, 2000)
  }

  const handleSocialRegister = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider.toLowerCase(), { callbackUrl: '/dashboard' })
    } catch (err) {
      toast.error(`Failed to sign up with ${provider}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <motion.div
        style={{ y: floatingYSpring }}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Header with Apple-style animations */}
          <motion.div
            style={{ y, opacity, scale }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Link href="/auth/login" className="inline-flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition-colors">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.div>
                <span>Back to Login</span>
              </Link>
              <Link href="/" className="block text-xs text-gray-400 hover:text-white mt-2">Back to Home</Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center space-x-3 mb-6"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                SketchMaster
              </motion.h1>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl font-semibold text-white mb-3"
            >
              Create your account
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-gray-300"
            >
              Sign up to start generating beautiful UIs
            </motion.p>
          </motion.div>

          {/* Social Register Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="space-y-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSocialRegister('Google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 shadow-xl"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Chrome className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">Sign up with Google</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSocialRegister('Apple')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-white hover:bg-black/90 transition-all duration-300 disabled:opacity-50 shadow-xl"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Apple className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">Sign up with Apple</span>
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-300">Or sign up with email</span>
            </div>
          </motion.div>

          {/* Email Register Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            onSubmit={handleEmailRegister}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-3">
                Email address
              </label>
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-3">
                Password
              </label>
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Create a password"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-3">
                Confirm Password
              </label>
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Confirm your password"
                  />
                </motion.div>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-2xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating account...</span>
                </motion.div>
              ) : (
                'Create account'
              )}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="text-center mt-8"
          >
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-12 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10"
          >
            <motion.h4
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="font-medium text-white mb-4 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span>What you'll get:</span>
            </motion.h4>
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="text-sm text-gray-300 space-y-2"
            >
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7, duration: 0.6 }}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Unlimited code generation</span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="flex items-center space-x-2"
              >
                <Shield className="w-3 h-3 text-green-400" />
                <span>Save and share projects</span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.9, duration: 0.6 }}
                className="flex items-center space-x-2"
              >
                <Users className="w-3 h-3 text-blue-400" />
                <span>Team collaboration features</span>
              </motion.li>
            </motion.ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 