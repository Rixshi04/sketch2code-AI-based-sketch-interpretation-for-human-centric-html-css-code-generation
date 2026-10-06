'use client'

import Link from 'next/link'

export default function Header({ title = 'SketchMaster' }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-bold text-slate-900">SketchMaster</Link>
        <span className="text-sm font-medium text-slate-500">{title}</span>
      </div>
    </header>
  )
}
