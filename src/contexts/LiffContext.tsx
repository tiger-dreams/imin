import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import liff from '@line/liff'

interface Profile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LiffContextType {
  isLoggedIn: boolean
  isInitialized: boolean
  isDev: boolean
  profile: Profile | null
  error: string | null
  login: () => void
  logout: () => void
}

const LiffContext = createContext<LiffContextType | undefined>(undefined)

const isDev = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dev = isDev()

  useEffect(() => {
    if (dev) {
      setIsInitialized(true)
      return
    }

    const liffId = import.meta.env.VITE_LIFF_ID as string
    if (!liffId) {
      setError('VITE_LIFF_ID is not set')
      setIsInitialized(true)
      return
    }

    liff.init({ liffId })
      .then(async () => {
        setIsInitialized(true)
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true)
          const p = await liff.getProfile()
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
            statusMessage: p.statusMessage,
          })
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'LIFF init failed')
        setIsInitialized(true)
      })
  }, [dev])

  const login = () => {
    if (dev) {
      setIsLoggedIn(true)
      setProfile({
        userId: 'dev-user-001',
        displayName: '개발자 (Dev Mode)',
        pictureUrl: undefined,
        statusMessage: '🛠 Development',
      })
      return
    }
    liff.login()
  }

  const logout = () => {
    if (dev) {
      setIsLoggedIn(false)
      setProfile(null)
      return
    }
    liff.logout()
    window.location.reload()
  }

  return (
    <LiffContext.Provider value={{ isLoggedIn, isInitialized, isDev: dev, profile, error, login, logout }}>
      {children}
    </LiffContext.Provider>
  )
}

export const useLiff = () => {
  const ctx = useContext(LiffContext)
  if (!ctx) throw new Error('useLiff must be used within LiffProvider')
  return ctx
}
