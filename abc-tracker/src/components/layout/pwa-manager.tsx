'use client'

import { useEffect, useState } from 'react'
import { Download, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOffline, setIsOffline] = useState(() => (typeof window !== 'undefined' ? !window.navigator.onLine : false))

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Fail silently so the app remains usable when SW registration fails.
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <>
      {isOffline ? (
        <div className="fixed inset-x-2 top-2 z-[60] rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 shadow">
          <span className="inline-flex items-center gap-2">
            <WifiOff className="size-4" aria-hidden="true" />
            You are offline. Recent pages may still be available.
          </span>
        </div>
      ) : null}

      {deferredPrompt ? (
        <div className="fixed bottom-24 right-4 z-50 md:bottom-6">
          <Button type="button" onClick={handleInstall} className="shadow-lg" aria-label="Install ABC Tracker app">
            <Download className="size-4" aria-hidden="true" />
            Install App
          </Button>
        </div>
      ) : null}
    </>
  )
}
