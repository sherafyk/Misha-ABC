'use client'

import { Sankey, ResponsiveContainer, Tooltip } from 'recharts'

export interface ABCPatternNode {
  name: string
}

export interface ABCPatternLink {
  source: number
  target: number
  value: number
}

export function ABCPatternFlow({ nodes, links }: { nodes: ABCPatternNode[]; links: ABCPatternLink[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey data={{ nodes, links }} node={{ stroke: '#334155', strokeWidth: 1, fill: '#93c5fd' }} link={{ stroke: '#64748b' }}>
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}
