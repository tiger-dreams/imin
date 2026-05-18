import { useState } from 'react'
import { LiffProvider, useLiff } from './contexts/LiffContext'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'
import MainPage from './pages/MainPage'
import AdminPage from './pages/AdminPage'
import type { LocationData } from './pages/VerifyPage'

const isAdmin = window.location.pathname === '/admin'

function AppRoutes() {
  const { isLoggedIn, isInitialized } = useLiff()
  const [location, setLocation] = useState<LocationData | null>(null)

  if (!isInitialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto" />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) return <LoginPage />
  if (!location) return <VerifyPage onVerified={setLocation} />
  return <MainPage location={location} />
}

export default function App() {
  if (isAdmin) return <AdminPage />

  return (
    <LiffProvider>
      <AppRoutes />
    </LiffProvider>
  )
}
