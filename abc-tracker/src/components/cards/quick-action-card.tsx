import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

export function QuickActionCard({ title, description, href, icon: Icon }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="rounded-xl border-slate-200 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex min-h-28 items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{title}</p>
            <p className="line-clamp-2 text-sm text-slate-500">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
