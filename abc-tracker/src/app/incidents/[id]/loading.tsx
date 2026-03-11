export default function IncidentDetailLoading() {
  return (
    <div className="space-y-3 p-4" role="status" aria-live="polite" aria-label="Loading incident">
      <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200" />
      <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
    </div>
  )
}
