import { useEffect, useRef } from 'react'

const HEARTBEAT_INTERVAL = 20_000

export function useHeartbeat(userId: string | undefined) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!userId) return

    const beat = () => {
      if (document.hidden) return
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {})
    }

    beat()
    timer.current = setInterval(beat, HEARTBEAT_INTERVAL)

    const onVisibility = () => {
      if (document.hidden) {
        if (timer.current) clearInterval(timer.current)
        timer.current = null
      } else {
        beat()
        timer.current = setInterval(beat, HEARTBEAT_INTERVAL)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer.current) clearInterval(timer.current)
    }
  }, [userId])
}
