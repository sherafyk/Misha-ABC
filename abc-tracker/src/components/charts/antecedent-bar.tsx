'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface AntecedentBarDatum {
  label: string
  count: number
}

export function AntecedentBar({ data }: { data: AntecedentBarDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="label" width={170} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#14b8a6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
