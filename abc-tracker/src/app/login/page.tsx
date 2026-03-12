'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseJsonResponse } from '@/lib/http'

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof schema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const form = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (values: LoginValues) => {
    setError(null)
    setLoading(true)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    })

    const body = await parseJsonResponse<{ error?: string }>(response)

    if (!response.ok) {
      setLoading(false)
      setError(body?.error ?? 'Unable to sign in')
      return
    }

    setLoading(false)
    const nextPath = searchParams.get('next') || '/'
    router.replace(nextPath)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in to ABC Tracker</CardTitle>
          <CardDescription>Use your Supabase account email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input autoComplete="username" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" autoComplete="current-password" {...form.register('password')} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
