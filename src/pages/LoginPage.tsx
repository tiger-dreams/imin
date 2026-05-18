import { useLiff } from '../contexts/LiffContext'

export default function LoginPage() {
  const { login, isDev } = useLiff()

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Logo */}
      <div className="mb-12 text-center animate-fade-up">
        <h1 className="text-6xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          imin
        </h1>
        <p className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
          I'm in — 지금 여기 있는 사람만 인증한다
        </p>
        <div
          className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: '#0d2818', color: 'var(--green)', border: '1px solid #166534' }}
        >
          Tech Week Hackathon Idea Competition KR
        </div>
      </div>

      {/* Login Button */}
      <div className="w-full max-w-xs animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <button
          onClick={login}
          className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-opacity active:opacity-80"
          style={{ background: '#06C755', color: '#fff' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2C6.03 2 2 5.58 2 10c0 2.97 1.87 5.57 4.68 7.08L6 20l3.3-1.73A10.1 10.1 0 0011 18.4c4.97 0 9-3.58 9-8s-4.03-8-9-8z" fill="white"/>
          </svg>
          LINE으로 로그인
        </button>

        {isDev && (
          <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            🛠 Dev mode — LINE 로그인 없이 진행됩니다
          </p>
        )}
      </div>
    </div>
  )
}
