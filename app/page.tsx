import Link from 'next/link'
import { Metadata } from 'next'
import { 
  Sparkles,
  Code,
  Zap,
  CheckCircle,
  Eye,
  ArrowRight,
  Upload,
  Layers,
  Cpu,
  MonitorSmartphone,
  Star,
  Shield,
  Check,
  ChevronRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'SketchMaster | AI-Powered Premium UI Code Generator',
  description: 'Transform your design sketches into pristine, production-ready code for React, Vue, Angular, Flutter, and SwiftUI in seconds.',
  keywords: ['AI code generation', 'UI generator', 'sketch to code', 'React', 'Vue', 'Angular', 'Flutter', 'SwiftUI'],
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px] transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-50 blur-md group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-full h-full bg-[#0a0a0a] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white/90" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              SketchMaster
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/generate" className="relative group overflow-hidden rounded-full px-6 py-2.5 bg-white text-black font-semibold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <span className="relative z-10 flex items-center gap-2">
                Launch App <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          SketchMaster v2.0 AI Engine Live
        </div>
        <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight">
          Turn your ideas into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            production UI code.
          </span>
        </h2>
        <p className="text-xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed">
          Upload hand-drawn sketches, wireframes, or high-fidelity designs. Let our context-aware AI architect flawless, accessible, and ultra-responsive code across 5+ platforms instantly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/generate"
            className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
          >
            Start Generating Free
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </Link>
          <Link
            href="#features"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-bold text-lg transition-all backdrop-blur-md"
          >
            Explore Features
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {/* Visual App Preview Placeholder or Image */}
        <div className="mt-24 relative mx-auto max-w-5xl group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 top-[50%]"></div>
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-2 transform rotate-x-12 scale-95 hover:scale-100 transition-all duration-700 hover:border-white/20 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="text-center z-20">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                   <Code className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Live AI Preview Engine</h3>
                <p className="text-white/60">Generate. Preview. Ship.</p>
              </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-[#0d0d12] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
             <h3 className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-3">Enterprise Capabilities</h3>
             <h2 className="text-4xl md:text-5xl font-bold text-white">Engineered for Perfection</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Upload, title: "Frictionless Uploads", desc: "Drag and drop any scribble, screenshot, or figma export. We parse the intent automatically.", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Layers, title: "Multi-Platform Export", desc: "React, Vue, Swift, Flutter, Angular. Output perfect syntax tailored for your favorite ecosystem.", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: Zap, title: "Zero Latency Preview", desc: "Real-time rendering engine allows you to view the output component live as it's generated.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { icon: Shield, title: "WCAG Accessibility", desc: "Built-in aria-labels, semantic HTML, and contrast checks guarantee an inclusive UI.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { icon: MonitorSmartphone, title: "Fluid Responsiveness", desc: "Auto-generated flexbox and grid layouts that bend and snap perfectly to any device screen.", color: "text-pink-400", bg: "bg-pink-400/10" },
              { icon: Cpu, title: "Edge Architecture", desc: "Powered by Gemini & GPT-4V with local CUDA fallbacks ensuring 99.9% uptime and low latency.", color: "text-orange-400", bg: "bg-orange-400/10" }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-32 overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h3 className="text-sm font-bold tracking-widest text-purple-500 uppercase mb-3">Workflow</h3>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">From napkin to production in 3 steps.</h2>
              <div className="space-y-10">
                {[
                  { step: "01", title: "Input the vision", desc: "Upload a rough sketch or describe the layout you need in plain text. Our AI understands human intent." },
                  { step: "02", title: "AI Generation", desc: "The engine breaks down complex UI hierarchies and generates pixel-perfect, highly optimized code." },
                  { step: "03", title: "Review & Deploy", desc: "Use the live sandboxed preview. Tweak the design, copy the code, and ship your product faster." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 relative">
                    {idx !== 2 && <div className="absolute left-[28px] top-[60px] bottom-[-40px] w-[2px] bg-white/10"></div>}
                    <div className="relative z-10 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-white/40 shadow-lg backdrop-blur-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-white/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
               <div className="rounded-3xl border border-white/10 bg-[#16161a] p-4 shadow-2xl">
                  {/* Faux Window Header */}
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  {/* Faux Code Editor */}
                  <div className="bg-[#0d0d12] rounded-2xl p-6 font-mono text-sm sm:text-base overflow-hidden border border-white/5 text-white/70 shadow-inner">
                     <p className="text-blue-400 mb-2">import React from 'react';</p>
                     <p className="text-purple-400 mb-2">import {`{ motion }`} from 'framer-motion';</p>
                     <br />
                     <p><span className="text-pink-400">export default function</span> <span className="text-yellow-200">HeroSection</span>() {'{'}</p>
                     <p className="pl-4">return (</p>
                     <p className="pl-8 text-green-300">{'<div className="min-h-screen bg-black flex...">'}</p>
                     <p className="pl-12 text-blue-200">{'<motion.h1>'}</p>
                     <p className="pl-16 text-white/50">{'// AI generated complex UI layout here'}</p>
                     <p className="pl-12 text-blue-200">{'</motion.h1>'}</p>
                     <p className="pl-8 text-green-300">{'</div>'}</p>
                     <p className="pl-4">)</p>
                     <p>{'}'}</p>
                     {/* Blinking cursor */}
                     <div className="w-2 h-5 bg-white/80 animate-pulse mt-2 ml-4"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 border-t border-white/5 bg-[#0d0d12] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-white mb-4">Loved by Founders & Engineers</h2>
             <p className="text-lg text-white/60">Join thousands shipping products 10x faster.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Sarah Jenks", role: "Frontend Lead", text: "SketchMaster completely removed the tedious HTML/CSS boilerplate phase. I literally upload a whiteboard picture and get a working Next.js component back." },
                { name: "David Chen", role: "Indie Hacker", text: "The quality of the generated code is insane. It uses proper semantic tags, tailwind classes are clean, and it even breaks things down logically." },
                { name: "Elena Rodriguez", role: "UI/UX Designer", text: "I can finally test my designs in the browser by myself without waiting for a developer to implement them. The live preview is magic." }
              ].map((t, idx) => (
                 <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
                    </div>
                    <p className="text-white/80 leading-relaxed mb-8">"{t.text}"</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center font-bold text-lg">
                         {t.name.charAt(0)}
                       </div>
                       <div>
                         <h5 className="font-bold text-white">{t.name}</h5>
                         <p className="text-sm text-white/50">{t.role}</p>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
             <p className="text-lg text-white/60">Start for free, upgrade when you need extreme power.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Free Tier */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                 <h3 className="text-2xl font-bold text-white mb-2">Hobby</h3>
                 <p className="text-white/50 mb-6">For personal projects and experiments.</p>
                 <div className="mb-8">
                    <span className="text-5xl font-extrabold text-white">$0</span>
                    <span className="text-white/50">/month</span>
                 </div>
                 <ul className="space-y-4 mb-8">
                    {[
                      '10 AI Generations per day',
                      'Standard Layouts',
                      'React & HTML Export',
                      'Community Support'
                    ].map((feat, i) => (
                       <li key={i} className="flex items-center gap-3 text-white/80">
                         <Check size={18} className="text-emerald-500" /> {feat}
                       </li>
                    ))}
                 </ul>
                 <Link href="/login" className="block w-full py-4 text-center rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">
                   Get Started
                 </Link>
              </div>

              {/* Pro Tier */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-b from-blue-600/20 to-purple-600/10 border border-blue-500/30 transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                 <div className="absolute top-0 right-8 transform -translate-y-1/2 flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   <Star size={12} className="fill-white" /> Popular
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                 <p className="text-blue-200/70 mb-6">For professionals shipping real products.</p>
                 <div className="mb-8">
                    <span className="text-5xl font-extrabold text-white">$19</span>
                    <span className="text-white/50">/month</span>
                 </div>
                 <ul className="space-y-4 mb-8">
                    {[
                      'Unlimited AI Generations',
                      'All Frameworks (Vue, Flutter, Swift)',
                      'Premium Layouts & Animations',
                      'Priority Generation Queue',
                      'Export Code Instantly'
                    ].map((feat, i) => (
                       <li key={i} className="flex items-center gap-3 text-white/90">
                         <Check size={18} className="text-blue-400" /> {feat}
                       </li>
                    ))}
                 </ul>
                 <Link href="/login" className="block w-full py-4 text-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02]">
                   Upgrade to Pro
                 </Link>
              </div>

           </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-16 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="relative z-10">
            <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to stop coding boilerplate?</h3>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join the future of UI development today. Build faster, design better, and ship instantly.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center space-x-2 px-10 py-5 bg-white text-black rounded-full hover:scale-105 transition-all text-lg font-bold shadow-xl"
            >
              <span>Launch the App Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
             <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                 </div>
                 <span className="text-xl font-bold text-white tracking-tight">SketchMaster</span>
             </div>
             <div className="flex space-x-6 text-sm font-medium text-white/50">
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">GitHub</a>
                <a href="#" className="hover:text-white transition-colors">Discord</a>
                <a href="#" className="hover:text-white transition-colors">Docs</a>
             </div>
           </div>
           <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-white/40">
              <p>© {new Date().getFullYear()} SketchMaster Inc. All rights reserved.</p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                 <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                 <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  )
}