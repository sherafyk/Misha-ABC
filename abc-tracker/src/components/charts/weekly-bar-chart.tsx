'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface WeeklyBarDatum {
  day: string
  incidents: number
}

interface WeeklyBarChartProps {
  data: WeeklyBarDatum[]
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: '#dbeafe' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1' }}
            formatter={(value) => [`${String(value ?? 0)} incidents`, 'Count']}
          />
          <Bar dataKey="incidents" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
