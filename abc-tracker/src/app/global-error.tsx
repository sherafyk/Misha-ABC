'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold text-slate-900">ABC Tracker hit an unexpected error</h2>
          <p className="mt-2 text-sm text-slate-600">Please reload and try again.</p>
          <Button className="mt-4" onClick={reset}>Reload</Button>
        </div>
      </body>
    </html>
  )
}
