import { IncidentDetailClient } from './incident-detail-client'

interface IncidentDetailPageProps {
  params: {
    id: string
  }
}

export default function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  return <IncidentDetailClient id={params.id} />
}
