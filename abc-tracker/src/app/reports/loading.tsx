export default function RouteLoading() {
  return (
    <div className="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading content">
      <div className="h-6 w-40 animate-pulse rounded-md bg-slate-200" />
      <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
    </div>
  )
}
