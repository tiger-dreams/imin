import { useState, useEffect, useCallback } from 'react'
import { Trophy, ChevronRight, RefreshCw, Users } from 'lucide-react'
import type { LocationData } from './VerifyPage'
import { useLiff } from '../contexts/LiffContext'

interface ActiveUser {
  userId: string
  displayName: string
  city: string
  country: string
  countryCode: string
  checkedInAt: number
}

interface Props {
  location: LocationData
  onBack: () => void
}

export default function RafflePage({ location, onBack }: Props) {
  const { profile } = useLiff()
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [raffleStatus, setRaffleStatus] = useState<'idle' | 'spinning' | 'result'>('idle')
  const [winner, setWinner] = useState<ActiveUser | null>(null)

  const fetchActive = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/active')
      if (res.ok) {
        const data = await res.json() as { users: ActiveUser[] }
        setUsers(data.users)
      }
    } catch {
      // API 없으면 현재 사용자만 표시
      if (profile) {
        setUsers([{
          userId: profile.userId,
          displayName: profile.displayName,
          city: location.city,
          country: location.country,
          countryCode: location.countryCode,
          checkedInAt: Date.now(),
        }])
      }
    } finally {
      setLoading(false)
    }
  }, [profile, location])

  useEffect(() => {
    fetchActive()
    const interval = setInterval(fetchActive, 10000) // 10초마다 갱신
    return () => clearInterval(interval)
  }, [fetchActive])

  const runRaffle = () => {
    if (users.length === 0 || raffleStatus === 'spinning') return
    setRaffleStatus('spinning')
    setWinner(null)

    setTimeout(() => {
      const picked = users[Math.floor(Math.random() * users.length)]
      setWinner(picked)
      setRaffleStatus('result')
    }, 1800)
  }

  const reset = () => { setRaffleStatus('idle'); setWinner(null) }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <ChevronRight size={16} className="rotate-180" style={{ color: 'var(--text-muted)' }} />
        </button>
        <div className="flex-1">
          <span className="font-semibold" style={{ color: 'var(--text)' }}>활성 세션 추첨</span>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>지금 앱을 열고 있는 사람만 대상</p>
        </div>
        <button onClick={fetchActive} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {/* 활성 인원 카운트 */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Users size={18} style={{ color: 'var(--green)' }} />
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{loading ? '...' : users.length}명</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>현재 활성 접속자</p>
          </div>
        </div>

        {/* 활성 유저 목록 */}
        {users.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {users.map((u, i) => (
              <div
                key={u.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: '#1f2937', color: 'var(--green)' }}
                >
                  {u.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{u.displayName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {countryFlag(u.countryCode)} {u.city}
                  </p>
                </div>
                {u.userId === profile?.userId && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0d2818', color: 'var(--green)' }}>나</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 추첨 영역 */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: '#facc15' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>추첨</span>
          </div>

          {raffleStatus === 'idle' && (
            <button
              onClick={runRaffle}
              disabled={users.length === 0}
              className="w-full py-4 rounded-xl font-bold text-base active:scale-95 transition-all disabled:opacity-40"
              style={{ background: '#facc15', color: '#0a0a0a' }}
            >
              🎰 추첨 시작!
            </button>
          )}

          {raffleStatus === 'spinning' && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-t-[#facc15] animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#facc15' }} />
                <Trophy size={24} className="absolute inset-0 m-auto" style={{ color: '#facc15' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>추첨 중...</p>
            </div>
          )}

          {raffleStatus === 'result' && winner && (
            <div className="text-center py-4 space-y-3 animate-bounce-in">
              <div className="text-5xl">🎉</div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto"
                style={{ background: '#1f2937', color: 'var(--green)' }}
              >
                {winner.displayName[0]}
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{winner.displayName}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {countryFlag(winner.countryCode)} {winner.city} · 당첨을 축하합니다!
                </p>
              </div>
              <button
                onClick={reset}
                className="text-sm px-5 py-2.5 rounded-xl active:opacity-70"
                style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
              >
                다시 추첨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function countryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}
