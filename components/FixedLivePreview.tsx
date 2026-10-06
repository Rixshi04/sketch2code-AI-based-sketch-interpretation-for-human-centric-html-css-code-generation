'use client'

import { useMemo } from 'react'

type Props = {
  code?: string
  css?: string
  platform?: string
  showControls?: boolean
}

function htmlSrcDoc(code: string, css: string) {
  if (/<html[\s>]/i.test(code) || /<!doctype/i.test(code)) {
    return code.replace('</head>', '<style>' + css + '</style></head>')
  }
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + code + '</body></html>'
}

export default function FixedLivePreview({ code = '', css = '', platform = 'html' }: Props) {
  const isHtml = platform.toLowerCase() === 'html'
  const srcDoc = useMemo(() => htmlSrcDoc(code, css), [code, css])

  if (!code.trim()) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No generated code to preview.</div>
  }

  if (!isHtml) {
    return (
      <div className="h-full overflow-auto bg-slate-950 p-4 text-left">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {platform} source preview
        </div>
        <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-100"><code>{code}</code></pre>
      </div>
    )
  }

  return (
    <iframe
      title="Generated HTML preview"
      className="h-full w-full border-0 bg-white"
      sandbox=""
      srcDoc={srcDoc}
    />
  )
}
