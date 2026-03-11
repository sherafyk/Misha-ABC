import { parseJsonResponse } from '@/lib/http'

export async function adminMutate<T>(operation: string, payload: Record<string, unknown>) {
  const response = await fetch('/api/admin/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ operation, payload }),
  })

  const body = await parseJsonResponse<{ data?: T; error?: string }>(response)

  if (!response.ok || body?.error) {
    throw new Error(body?.error ?? `Admin mutation failed (HTTP ${response.status})`)
  }

  if (!body?.data) {
    throw new Error('Admin mutation failed: empty server response')
  }

  return body.data as T
}
