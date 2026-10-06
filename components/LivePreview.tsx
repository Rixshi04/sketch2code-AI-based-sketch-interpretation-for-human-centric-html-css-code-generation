'use client'

import FixedLivePreview from './FixedLivePreview'

type Props = {
  html: string
  css?: string
  showControls?: boolean
  autoUpdate?: boolean
}

export default function LivePreview({ html, css = '' }: Props) {
  return <div className="h-[32rem] overflow-hidden rounded-lg border border-gray-200"><FixedLivePreview code={html} css={css} platform="html" /></div>
}
