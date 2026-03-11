'use client'

import { Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'

export interface TimeOfDayHeatmapDatum {
  hour: number
  day: string
  count: number
}

const palette = ['#e2e8f0', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8']

export function TimeOfDayHeatmap({ data }: { data: TimeOfDayHeatmapDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
          <XAxis dataKey="hour" name="Hour" type="number" domain={[0, 23]} tickCount={8} />
          <YAxis dataKey="day" name="Day" type="category" width={90} />
          <ZAxis dataKey="count" range={[60, 280]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${String(value)} incidents`, 'Count']} />
          <Scatter data={data}>
            {data.map((item, index) => {
              const colorIndex = Math.min(Math.floor(item.count), palette.length - 1)
              return <Cell key={`${item.day}-${item.hour}-${index}`} fill={palette[colorIndex]} />
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
