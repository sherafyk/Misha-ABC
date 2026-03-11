export default function RootLoading() {
  return (
    <div className="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading page">
      <div className="h-8 w-1/2 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
    </div>
  )
}
