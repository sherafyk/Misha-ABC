'use client'

import { Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthSession } from '@/lib/hooks/use-auth-session'

export function AdminAccessCard({ title }: { title: string }) {
  const { isAdmin, role, screenName, loading, logout } = useAuthSession()

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" /> {title}</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium">{screenName ?? 'user'}</span> ({role ?? 'unknown'}).
          {isAdmin ? ' You have full administrative access.' : ' You can log incidents, quick log, and use standard caregiver features.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => void logout()}>Log out</Button>
      </CardContent>
    </Card>
  )
}
