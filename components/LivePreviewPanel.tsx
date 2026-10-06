'use client'

import FixedLivePreview from './FixedLivePreview'

export interface LivePreviewPanelProps {
  code: string
  platform?: string
}

export default function LivePreviewPanel({ code, platform = 'react' }: LivePreviewPanelProps) {
  return (
    <div className="h-[32rem] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <FixedLivePreview code={code} platform={platform} />
    </div>
  )
}
