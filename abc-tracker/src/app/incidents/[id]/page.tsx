interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;

  return <div className="p-6">Incident detail placeholder for incident {id}.</div>;
}
