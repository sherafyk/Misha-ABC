'use client'

import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

export interface CorrelationScatterDatum {
  x: number
  y: number
  label: string
}

export function CorrelationScatter({ data, xLabel, yLabel }: { data: CorrelationScatterDatum[]; xLabel: string; yLabel: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
          <XAxis dataKey="x" name={xLabel} type="number" label={{ value: xLabel, position: 'insideBottom', offset: -10 }} />
          <YAxis dataKey="y" name={yLabel} type="number" allowDecimals={false} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [String(value), String(name)]} />
          <Scatter data={data} fill="#14b8a6" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
