import { useState } from 'react'
import { Trophy, Wifi, CheckCircle, LogOut, ChevronRight, CalendarDays, MessageCircleQuestion, HelpCircle, Presentation, PartyPopper, Info } from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'
import type { LocationData } from './VerifyPage'
import RafflePage from './RafflePage'

interface Props {
  location: LocationData
}

type View = 'menu' | 'raffle'

export default function MainPage({ location }: Props) {
  const { profile, logout } = useLiff()
  const [view, setView] = useState<View>('menu')

  if (view === 'raffle') return <RafflePage location={location} onBack={() => setView('menu')} />

  const soon = () => alert('준비 중이에요!')

  return (
    <div className="min-h-dvh flex flex-col pb-8" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>imin</span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tech Week Hackathon Idea Competition KR</p>
        </div>
        <button onClick={logout} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <LogOut size={15} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      <div className="px-4 pt-2 space-y-3">
        {/* 프로필 + 체크인 뱃지 */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--green-dim)' }}>
          {profile?.pictureUrl ? (
            <img src={profile.pictureUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: '#1f2937', color: 'var(--green)' }}>
              {(profile?.displayName ?? '?')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{profile?.displayName ?? '참가자'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{location.city}, {location.country}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: '#0d2818', border: '1px solid var(--green-dim)' }}>
            <CheckCircle size={13} style={{ color: 'var(--green)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>I'm in!</span>
          </div>
        </div>

        {/* Presence Score */}
        <PresenceBar location={location} />

        {/* 메뉴 블록들 */}
        <p className="text-xs font-semibold px-1 pt-1" style={{ color: 'var(--text-muted)' }}>FEATURES</p>

        <MenuItem icon={<Trophy size={18} style={{ color: '#facc15' }} />}     title="활성 세션 추첨"      desc="지금 앱을 열고 있는 사람만 대상"    color="#facc15" onClick={() => setView('raffle')} />
        <MenuItem icon={<CalendarDays size={18} style={{ color: '#60a5fa' }} />} title="타임 테이블"         desc="세션 일정 보기"                    color="#60a5fa" onClick={soon} />
        <MenuItem icon={<Presentation size={18} style={{ color: '#a78bfa' }} />} title="발표 슬라이드"       desc="세션별 자료 다운로드"              color="#a78bfa" onClick={soon} />
        <MenuItem icon={<MessageCircleQuestion size={18} style={{ color: '#f472b6' }} />} title="연사에게 질문하기" desc="익명으로 질문 남기기"         color="#f472b6" onClick={soon} />
        <MenuItem icon={<PartyPopper size={18} style={{ color: '#fb923c' }} />}  title="이벤트"              desc="현장 이벤트 참여"                  color="#fb923c" onClick={soon} />
        <MenuItem icon={<HelpCircle size={18} style={{ color: '#34d399' }} />}   title="주최 측에 문의하기"  desc="운영진에게 바로 연락"              color="#34d399" onClick={soon} />
        <MenuItem icon={<Wifi size={18} style={{ color: '#94a3b8' }} />}         title="WiFi 비밀번호"       desc="탭하면 클립보드에 복사"            color="#94a3b8"
          onClick={() => { navigator.clipboard?.writeText('hackday!'); alert('복사됐어요: hackday!') }} />
        <MenuItem icon={<Info size={18} style={{ color: '#64748b' }} />}         title="행사 기타 정보"      desc="장소, 주차, 공지"                  color="#64748b" onClick={soon} />
      </div>
    </div>
  )
}

function MenuItem({ icon, title, desc, color, onClick }: {
  icon: React.ReactNode; title: string; desc: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 flex items-center gap-4 text-left active:opacity-70 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
    </button>
  )
}

function PresenceBar({ location }: { location: LocationData }) {
  const score = 40 + 20 + (location.gpsLat ? 20 : 0)
  const label = score >= 60 ? '인증 완료' : '부분 인증'
  const color = score >= 60 ? 'var(--green)' : '#facc15'
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Presence Score</span>
        <span className="text-xs font-bold" style={{ color }}>{score}pt — {label}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

