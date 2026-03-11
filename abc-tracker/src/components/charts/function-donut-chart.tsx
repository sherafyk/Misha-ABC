'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface FunctionDonutDatum {
  name: string
  value: number
  color: string
}

interface FunctionDonutChartProps {
  data: FunctionDonutDatum[]
}

export function FunctionDonutChart({ data }: FunctionDonutChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1' }}
            formatter={(value, name) => [`${String(value ?? 0)} incidents`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
