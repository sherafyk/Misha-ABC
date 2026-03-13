'use client'

import { useSearchParams } from 'next/navigation'

import { DailyLogForm } from '@/components/forms/daily-log-form'
import { IncidentForm } from '@/components/forms/incident-form'
import { QuickLog } from '@/components/forms/quick-log'
import { AdminAccessCard } from '@/components/layout/admin-access-card'
import { useAuthSession } from '@/lib/hooks/use-auth-session'

export function LogPageClient() {
  const { authenticated, loading } = useAuthSession()
  const searchParams = useSearchParams()
  const editingIncidentId = searchParams.get('incidentId')

  return (
    <main className="space-y-6 p-4 pb-24 md:p-6">
      <AdminAccessCard title="Current access" />
      {authenticated && !loading ? (
        <>
          {!editingIncidentId ? <QuickLog /> : null}
          {!editingIncidentId ? <DailyLogForm /> : null}
          <IncidentForm />
        </>
      ) : null}
    </main>
  )
}
