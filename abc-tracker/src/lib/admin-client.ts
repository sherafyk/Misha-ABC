export async function adminMutate<T>(operation: string, payload: Record<string, unknown>) {
  const response = await fetch('/api/admin/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ operation, payload }),
  })

  const body = (await response.json()) as { data?: T; error?: string }

  if (!response.ok || body.error) {
    throw new Error(body.error ?? 'Admin mutation failed')
  }

  return body.data as T
}
