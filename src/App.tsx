import { useEffect, useState } from 'react'
import { LiffProvider, useLiff } from './contexts/LiffContext'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'
import MainPage from './pages/MainPage'
import AdminPage from './pages/AdminPage'
import AdminHubPage from './pages/AdminHubPage'
import AdminWallPage from './pages/AdminWallPage'
import WallPage from './pages/WallPage'
import EventPlatformPage from './pages/EventPlatformPage'
import ReleaseNotesPage from './pages/ReleaseNotesPage'
import BlogPage from './pages/BlogPage'
import type { LocationData } from './pages/VerifyPage'

function AppRoutes({ path }: { path: string }) {
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

  if (path === '/checkin') {
    if (!location) return <VerifyPage onVerified={setLocation} />
    return <MainPage location={location} />
  }

  if (path === '/' || path.startsWith('/events')) return <EventPlatformPage />

  if (!location) return <VerifyPage onVerified={setLocation} />
  return <MainPage location={location} />
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  if (path === '/wall') return <WallPage />
  if (path === '/release') return <ReleaseNotesPage />
  if (path === '/admin/raffle') return <AdminPage />
  if (path === '/admin/wall') return <AdminWallPage />
  if (path === '/admin') return <AdminHubPage />
  if (path === '/release-notes') return <ReleaseNotesPage />
  if (path === '/blog') return <BlogPage />

  return (
    <LiffProvider>
      <AppRoutes path={path} />
    </LiffProvider>
  )
}
