import { useState } from 'react'
import { Trophy, MapPin, Wifi, CheckCircle, LogOut, ChevronRight } from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'
import type { LocationData } from './VerifyPage'
import RafflePage from './RafflePage'

interface Props {
  location: LocationData
}

type View = 'menu' | 'raffle' | 'map'

export default function MainPage({ location }: Props) {
  const { profile, logout } = useLiff()
  const [view, setView] = useState<View>('menu')

  if (view === 'raffle') return <RafflePage location={location} onBack={() => setView('menu')} />
  if (view === 'map') return <MapPage location={location} onBack={() => setView('menu')} />

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
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

        {/* Presence Score 요약 */}
        <PresenceBar location={location} />

        {/* 메뉴 블록들 */}
        <p className="text-xs font-semibold px-1 pt-1" style={{ color: 'var(--text-muted)' }}>FEATURES</p>

        <MenuItem
          icon={<Trophy size={18} style={{ color: '#facc15' }} />}
          title="활성 세션 추첨"
          desc="지금 앱을 열고 있는 사람만 대상"
          color="#facc15"
          onClick={() => setView('raffle')}
        />
        <MenuItem
          icon={<MapPin size={18} style={{ color: '#60a5fa' }} />}
          title="내 위치 지도"
          desc={`${location.gpsLat?.toFixed(5)}, ${location.gpsLon?.toFixed(5)}`}
          color="#60a5fa"
          onClick={() => setView('map')}
        />
        <MenuItem
          icon={<Wifi size={18} style={{ color: '#a78bfa' }} />}
          title="WiFi 비밀번호"
          desc="imin2026 / hackday!"
          color="#a78bfa"
          onClick={() => {
            navigator.clipboard?.writeText('hackday!')
            alert('비밀번호가 클립보드에 복사됐어요!')
          }}
        />
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

function MapPage({ location, onBack }: { location: LocationData; onBack: () => void }) {
  const lat = location.gpsLat ?? location.geoLat
  const lon = location.gpsLon ?? location.geoLon
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <ChevronRight size={16} className="rotate-180" style={{ color: 'var(--text-muted)' }} />
        </button>
        <span className="font-semibold" style={{ color: 'var(--text)' }}>내 위치</span>
      </div>
      <div className="flex-1 mx-4 rounded-2xl overflow-hidden" style={{ minHeight: 400 }}>
        <iframe
          title="map-full"
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: 400 }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`}
        />
      </div>
      <div className="px-4 py-4 space-y-1">
        <p className="text-xs text-center font-mono" style={{ color: 'var(--text-muted)' }}>
          {lat.toFixed(6)}, {lon.toFixed(6)}
          {location.gpsAccuracy && ` (±${Math.round(location.gpsAccuracy)}m)`}
        </p>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {location.city}, {location.region}, {location.country}
        </p>
      </div>
    </div>
  )
}
