'use client'

import { useEffect, useState } from 'react'

/**
 * Starts from the server-rendered timestamp so SSR and hydration agree,
 * then ticks on the client.
 */
export function useNow(initialNow: number, intervalMs = 1000) {
  const [now, setNow] = useState(initialNow)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
