import { IncidentDetailClient } from './incident-detail-client'

interface IncidentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params
  return <IncidentDetailClient id={id} />
}
