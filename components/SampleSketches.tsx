'use client'

type Props = {
  onSelectSketch: (imageData: string) => void
  onClose: () => void
  selectedPlatform?: string
}

const samples = [
  { name: 'Landing sketch', data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWRkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IndoaXRlIi8+PC9zdmc+' },
]

export default function SampleSketches({ onSelectSketch, onClose }: Props) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Sample sketches</h2><button type="button" onClick={onClose}>Close</button></div>
      <div className="grid gap-3">
        {samples.map((sample) => <button key={sample.name} type="button" onClick={() => onSelectSketch(sample.data)} className="rounded-xl border p-4 text-left hover:bg-gray-50">{sample.name}</button>)}
      </div>
    </div>
  </div>
}
