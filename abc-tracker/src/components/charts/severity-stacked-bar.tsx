'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface SeverityStackedBarDatum {
  date: string
  low: number
  medium: number
  high: number
  crisis: number
}

export function SeverityStackedBar({ data }: { data: SeverityStackedBarDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="low" stackId="severity" fill="#22c55e" />
          <Bar dataKey="medium" stackId="severity" fill="#f59e0b" />
          <Bar dataKey="high" stackId="severity" fill="#f97316" />
          <Bar dataKey="crisis" stackId="severity" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
