import { DailyLogForm } from '@/components/forms/daily-log-form'
import { IncidentForm } from '@/components/forms/incident-form'
import { QuickLog } from '@/components/forms/quick-log'

export default function LogPage() {
  return (
    <main className="space-y-6 p-4 pb-24 md:p-6">
      <QuickLog />
      <DailyLogForm />
      <IncidentForm />
    </main>
  )
}
