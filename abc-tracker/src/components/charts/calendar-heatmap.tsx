'use client'

export interface CalendarHeatmapDatum {
  date: string
  count: number
}

export function CalendarHeatmap({ data }: { data: CalendarHeatmapDatum[] }) {
  const byDate = new Map(data.map((item) => [item.date, item.count]))

  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (34 - index))
    const iso = date.toISOString().slice(0, 10)
    const count = byDate.get(iso) ?? 0
    return { iso, count }
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => (
        <div
          key={day.iso}
          className="aspect-square rounded-md border border-slate-200 text-[10px] text-slate-700"
          style={{ backgroundColor: day.count === 0 ? '#f8fafc' : `rgba(59,130,246,${Math.min(0.2 + day.count * 0.12, 0.95)})` }}
          title={`${day.iso}: ${day.count} incidents`}
        >
          <div className="p-1">{day.iso.slice(8, 10)}</div>
        </div>
      ))}
    </div>
  )
}
