'use client'

import { FormEvent, useState } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdminSession } from '@/lib/hooks/use-admin-session'

export function AdminAccessCard({ title }: { title: string }) {
  const { isAdmin, configured, loading, login, logout } = useAdminSession()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login(password)
      setPassword('')
      toast.success('Admin mode enabled.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to login.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin security is not configured</CardTitle>
          <CardDescription>Add ADMIN_ACCESS_PASSWORD and ADMIN_SESSION_SECRET to enable write access.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-600" /> Admin mode enabled</CardTitle>
          <CardDescription>You can create, edit, and delete records on this device until you log out.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void logout()}>Log out of admin mode</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Viewing data is public. Enter the admin password to make changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex gap-2" onSubmit={(event) => void onSubmit(event)}>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Admin password"
          />
          <Button type="submit" disabled={submitting || !password.trim()}>
            Unlock
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
