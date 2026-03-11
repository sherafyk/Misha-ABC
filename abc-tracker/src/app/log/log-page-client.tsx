'use client'

import { DailyLogForm } from '@/components/forms/daily-log-form'
import { IncidentForm } from '@/components/forms/incident-form'
import { QuickLog } from '@/components/forms/quick-log'
import { AdminAccessCard } from '@/components/layout/admin-access-card'
import { useAdminSession } from '@/lib/hooks/use-admin-session'

export function LogPageClient() {
  const { isAdmin, loading } = useAdminSession()

  return (
    <main className="space-y-6 p-4 pb-24 md:p-6">
      <AdminAccessCard title="Admin login required to log incidents" />
      {isAdmin && !loading ? (
        <>
          <QuickLog />
          <DailyLogForm />
          <IncidentForm />
        </>
      ) : null}
    </main>
  )
}
