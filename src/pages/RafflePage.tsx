import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, Users, Trophy, Gift, Clock } from 'lucide-react'
import type { LocationData } from './VerifyPage'
import { useLiff } from '../contexts/LiffContext'

interface ActiveUser {
  userId: string
  displayName: string
  city: string
  country: string
  countryCode: string
  score?: number
}

type RaffleStatus = 'idle' | 'open' | 'drawing' | 'result'

interface RaffleState {
  status: RaffleStatus
  prize?: string
  count?: number
  winners?: ActiveUser[]
  pool?: ActiveUser[]
}

interface Props {
  location: LocationData
  onBack: () => void
}

export default function RafflePage({ location, onBack }: Props) {
  const { profile } = useLiff()
  const [raffle, setRaffle] = useState<RaffleState>({ status: 'idle' })
  const [activeCount, setActiveCount] = useState(0)

  const fetchState = useCallback(async () => {
    try {
      const [raffleRes, activeRes] = await Promise.all([
        fetch('/api/raffle-state'),
        fetch('/api/active'),
      ])
      if (raffleRes.ok) setRaffle(await raffleRes.json() as RaffleState)
      if (activeRes.ok) {
        const d = await activeRes.json() as { users: ActiveUser[] }
        setActiveCount(d.users.length)
      }
    } catch { /* 폴백 유지 */ }
  }, [])

  useEffect(() => {
    fetchState()
    const t = setInterval(fetchState, 4000)
    return () => clearInterval(t)
  }, [fetchState])

  const isWinner = raffle.winners?.some(w => w.userId === profile?.userId)
  const myScore = 40 + 20 + (location.gpsLat ? 20 : 0)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>활성 세션 추첨</span>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>지금 앱을 열고 있는 사람만 대상</p>
        </div>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {/* 내 상태 카드 */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: '#1f2937', color: 'var(--green)' }}>
            {(profile?.displayName ?? '?')[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{profile?.displayName ?? '참가자'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{countryFlag(location.countryCode)} {location.city}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: 'var(--green)' }}>{myScore}pt</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>내 점수</p>
          </div>
        </div>

        {/* 현재 접속자 수 */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Users size={18} style={{ color: 'var(--green)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>현재 활성 접속자</p>
          <span className="ml-auto text-xl font-bold" style={{ color: 'var(--text)' }}>{activeCount}명</span>
        </div>

        {/* 상태별 UI */}
        {raffle.status === 'idle' && <WaitingState label="추첨 대기 중" desc="호스트가 추첨을 시작하면 자동으로 업데이트돼요" />}
        {raffle.status === 'open' && <WaitingState label="추첨 준비됨" desc="앱을 계속 열어두세요. 곧 추첨이 시작됩니다" active />}
        {raffle.status === 'drawing' && <DrawingState />}
        {raffle.status === 'result' && raffle.winners && (
          <ResultState winners={raffle.winners} isWinner={!!isWinner} prize={raffle.prize} myUserId={profile?.userId} />
        )}
      </div>
    </div>
  )
}

function WaitingState({ label, desc, active = false }: { label: string; desc: string; active?: boolean }) {
  return (
    <div className="rounded-2xl p-8 text-center space-y-3" style={{ background: 'var(--bg-card)', border: `1px solid ${active ? 'var(--green-dim)' : 'var(--border)'}` }}>
      <Clock size={32} style={{ color: active ? 'var(--green)' : 'var(--text-muted)', margin: '0 auto' }} />
      <p className="font-semibold" style={{ color: active ? 'var(--green)' : 'var(--text)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      {active && <div className="flex justify-center gap-1.5 pt-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)', animationDelay: `${i * 0.2}s` }} />)}</div>}
    </div>
  )
}

function DrawingState() {
  return (
    <div className="rounded-2xl p-10 text-center space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#facc15' }} />
      <p className="font-bold text-lg" style={{ color: '#facc15' }}>추첨 중...</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>잠시만 기다려주세요</p>
    </div>
  )
}

function ResultState({ winners, isWinner, prize, myUserId }: { winners: ActiveUser[]; isWinner: boolean; prize?: string; myUserId?: string }) {
  return (
    <div className="space-y-3">
      {/* 내 결과 */}
      <div className="rounded-2xl p-6 text-center space-y-2" style={{ background: isWinner ? '#0d2818' : 'var(--bg-card)', border: `1px solid ${isWinner ? 'var(--green-dim)' : 'var(--border)'}` }}>
        <Trophy size={28} style={{ color: isWinner ? 'var(--green)' : 'var(--text-muted)', margin: '0 auto' }} />
        <p className="text-xl font-bold" style={{ color: isWinner ? 'var(--green)' : 'var(--text)' }}>
          {isWinner ? '당첨되었습니다!' : '아쉽지만 다음 기회에'}
        </p>
        {prize && <p className="text-sm flex items-center justify-center gap-1.5" style={{ color: '#facc15' }}><Gift size={13} />{prize}</p>}
      </div>

      {/* 당첨자 목록 */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <Trophy size={14} style={{ color: '#facc15' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>당첨자 {winners.length}명</span>
        </div>
        {winners.map((w, i) => (
          <div key={w.userId} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: w.userId === myUserId ? '#0d2818' : 'transparent' }}>
            <span className="text-sm font-bold w-5" style={{ color: '#facc15' }}>{i + 1}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#1f2937', color: 'var(--green)' }}>{w.displayName[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{w.displayName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{countryFlag(w.countryCode)} {w.city}</p>
            </div>
            {w.userId === myUserId && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0d2818', color: 'var(--green)' }}>나</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function countryFlag(code: string) {
  return code?.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) ?? ''
}
