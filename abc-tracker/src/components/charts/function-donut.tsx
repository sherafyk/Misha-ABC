'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface FunctionDonutDatum {
  name: string
  value: number
  color: string
}

export function FunctionDonut({ data }: { data: FunctionDonutDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${String(value)} incidents`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
