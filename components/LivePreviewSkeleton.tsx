export default function LivePreviewSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-[28rem] animate-pulse rounded-xl bg-gray-100" />
    </div>
  )
}
