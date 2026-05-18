import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LiffProvider, useLiff } from './contexts/LiffContext'
import LoginPage from './pages/LoginPage'
import CheckInPage from './pages/CheckInPage'

function AppRoutes() {
  const { isLoggedIn, isInitialized } = useLiff()

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

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={isLoggedIn ? <CheckInPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LiffProvider>
        <AppRoutes />
      </LiffProvider>
    </BrowserRouter>
  )
}
