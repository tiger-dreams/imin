import { useState, useEffect, useCallback } from 'react'
import { MapPin, Wifi, Globe, Trophy, RefreshCw, LogOut, CheckCircle, MessageSquare, Send } from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'

interface GeoInfo {
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  lat: number
  lon: number
  isp: string
  status: 'loading' | 'ok' | 'error'
}

interface GpsInfo {
  lat: number
  lon: number
  accuracy: number
  status: 'idle' | 'loading' | 'ok' | 'denied' | 'error'
}

interface RaffleState {
  status: 'idle' | 'spinning' | 'result'
  winner: string | null
  pool: string[]
}

const DEMO_POOL = [
  '정덕범', '김진선', '이태환', '박서준', '최지원',
  '이소영', '김나래', '최승욱', '이동열', '박민준',
]

export default function CheckInPage() {
  const { profile, logout } = useLiff()
  const [geo, setGeo] = useState<GeoInfo>({ ip: '', city: '', region: '', country: '', countryCode: '', lat: 0, lon: 0, isp: '', status: 'loading' })
  const [gps, setGps] = useState<GpsInfo>({ lat: 0, lon: 0, accuracy: 0, status: 'idle' })
  const [checkedIn, setCheckedIn] = useState(false)
  const [raffle, setRaffle] = useState<RaffleState>({ status: 'idle', winner: null, pool: DEMO_POOL })
  const [wallMsg, setWallMsg] = useState('')
  const [sentWallMsg, setSentWallMsg] = useState<string | null>(null)
  const [sendingWall, setSendingWall] = useState(false)

  // GeoIP fetch — ipapi.co supports HTTPS on free tier
  const fetchGeo = useCallback(async () => {
    setGeo(prev => ({ ...prev, status: 'loading' }))
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json() as {
        ip: string; city: string; region: string; country_name: string;
        country_code: string; latitude: number; longitude: number; org: string; error?: boolean
      }
      if (!data.error) {
        setGeo({ ip: data.ip, city: data.city, region: data.region, country: data.country_name, countryCode: data.country_code, lat: data.latitude, lon: data.longitude, isp: data.org, status: 'ok' })
      } else {
        setGeo(prev => ({ ...prev, status: 'error' }))
      }
    } catch {
      setGeo(prev => ({ ...prev, status: 'error' }))
    }
  }, [])

  useEffect(() => { fetchGeo() }, [fetchGeo])

  // GPS
  const requestGps = () => {
    setGps(prev => ({ ...prev, status: 'loading' }))
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, status: 'ok' }),
      err => setGps(prev => ({ ...prev, status: err.code === 1 ? 'denied' : 'error' })),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Raffle
  const runRaffle = () => {
    if (raffle.status === 'spinning') return
    setRaffle(prev => ({ ...prev, status: 'spinning', winner: null }))
    const pool = [...raffle.pool]
    if (profile?.displayName && !pool.includes(profile.displayName)) {
      pool.push(profile.displayName)
    }
    setTimeout(() => {
      const winner = pool[Math.floor(Math.random() * pool.length)]
      setRaffle(prev => ({ ...prev, status: 'result', winner, pool }))
    }, 1800)
  }

  const resetRaffle = () => setRaffle(prev => ({ ...prev, status: 'idle', winner: null }))

  const sendWallMsg = async () => {
    if (!wallMsg.trim() || sendingWall) return
    setSendingWall(true)
    try {
      await fetch('/api/wall-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: wallMsg.trim(), displayName: profile?.displayName, userId: profile?.userId }),
      })
      setSentWallMsg(wallMsg.trim())
      setWallMsg('')
    } finally {
      setSendingWall(false)
    }
  }

  return (
    <div className="min-h-dvh pb-8" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe-area-inset-top pt-6 pb-4">
        <img src="/logo.png" alt="imin" className="h-7" style={{ filter: 'brightness(0) invert(1)' }} />
        <button onClick={logout} className="p-2 rounded-xl transition-opacity active:opacity-60" style={{ background: 'var(--bg-card)' }}>
          <LogOut size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Profile Card */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {profile?.pictureUrl ? (
            <img src={profile.pictureUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: '#1f2937', color: 'var(--green)' }}>
              {(profile?.displayName ?? '?')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate" style={{ color: 'var(--text)' }}>
              {profile?.displayName ?? '사용자'}
            </p>
            {profile?.statusMessage && (
              <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {profile.statusMessage}
              </p>
            )}
          </div>

          {/* Check-in badge */}
          {checkedIn && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl animate-bounce-in" style={{ background: '#0d2818', border: '1px solid var(--green-dim)' }}>
              <CheckCircle size={14} style={{ color: 'var(--green)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>I'm in!</span>
            </div>
          )}
        </div>

        {/* Check-in Button */}
        {!checkedIn ? (
          <button
            onClick={() => setCheckedIn(true)}
            className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{ background: 'var(--green)', color: '#0a0a0a' }}
          >
            <CheckCircle size={22} />
            I'm in!
          </button>
        ) : (
          <div className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2" style={{ background: '#0d2818', border: '1px solid var(--green-dim)', color: 'var(--green)' }}>
            <CheckCircle size={22} />
            체크인 완료
          </div>
        )}

        {/* GeoIP Card */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: 'var(--green)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>GeoIP</span>
            </div>
            <button onClick={fetchGeo} className="p-1.5 rounded-lg transition-opacity active:opacity-60" style={{ background: 'var(--bg-card2)' }}>
              <RefreshCw size={12} style={{ color: 'var(--text-muted)' }} className={geo.status === 'loading' ? 'animate-spin' : ''} />
            </button>
          </div>

          {geo.status === 'loading' && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 rounded-md animate-pulse" style={{ background: 'var(--bg-card2)', width: `${60 + i * 10}%` }} />
              ))}
            </div>
          )}

          {geo.status === 'ok' && (
            <div className="space-y-2">
              <GeoRow label="IP" value={geo.ip} />
              <GeoRow label="위치" value={`${geo.city}, ${geo.region}, ${geo.country}`} flag={geo.countryCode} />
              <GeoRow label="좌표" value={`${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}`} />
              <GeoRow label="ISP" value={geo.isp} />
            </div>
          )}

          {geo.status === 'error' && (
            <p className="text-sm" style={{ color: '#f87171' }}>GeoIP 조회 실패. 새로고침 버튼을 눌러주세요.</p>
          )}
        </div>

        {/* GPS Card */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: 'var(--green)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>GPS 위치</span>
          </div>

          {gps.status === 'idle' && (
            <button
              onClick={requestGps}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
              style={{ background: 'var(--green)', color: '#0a0a0a' }}
            >
              📍 위치 권한 요청
            </button>
          )}

          {gps.status === 'loading' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>위치 확인 중...</span>
            </div>
          )}

          {gps.status === 'ok' && (
            <div className="space-y-2">
              <GeoRow label="위도" value={gps.lat.toFixed(6)} />
              <GeoRow label="경도" value={gps.lon.toFixed(6)} />
              <GeoRow label="정확도" value={`±${Math.round(gps.accuracy)}m`} />
              <a
                href={`https://maps.google.com/?q=${gps.lat},${gps.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-1"
                style={{ color: 'var(--green)' }}
              >
                <MapPin size={12} />
                지도에서 보기
              </a>
            </div>
          )}

          {gps.status === 'denied' && (
            <p className="text-sm" style={{ color: '#f87171' }}>위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.</p>
          )}

          {gps.status === 'error' && (
            <p className="text-sm" style={{ color: '#f87171' }}>위치 조회 실패. 다시 시도해주세요.</p>
          )}
        </div>

        {/* Raffle Card */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: '#facc15' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>활성 세션 추첨 (데모)</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
              {raffle.pool.length + (profile?.displayName && !raffle.pool.includes(profile.displayName) ? 1 : 0)}명
            </span>
          </div>

          {raffle.status === 'idle' && (
            <button
              onClick={runRaffle}
              disabled={!checkedIn}
              className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: checkedIn ? '#facc15' : 'var(--bg-card2)', color: checkedIn ? '#0a0a0a' : 'var(--text-muted)' }}
            >
              {checkedIn ? '🎰 추첨 시작!' : '체크인 후 추첨 가능'}
            </button>
          )}

          {raffle.status === 'spinning' && (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full animate-spin border-4" style={{ borderColor: 'var(--border)', borderTopColor: '#facc15' }} />
                <Trophy size={24} className="absolute inset-0 m-auto" style={{ color: '#facc15' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>추첨 중...</p>
            </div>
          )}

          {raffle.status === 'result' && raffle.winner && (
            <div className="text-center py-3 animate-bounce-in space-y-3">
              <div className="text-4xl">🎉</div>
              <div>
                <p className="text-xl font-bold" style={{ color: 'var(--green)' }}>{raffle.winner}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>당첨을 축하합니다!</p>
              </div>
              <button
                onClick={resetRaffle}
                className="text-xs px-4 py-2 rounded-xl transition-opacity active:opacity-60"
                style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
              >
                다시 추첨
              </button>
            </div>
          )}
        </div>

        {/* Presence Score */}
        <PresenceScore geo={geo} gps={gps} checkedIn={checkedIn} />

        {/* 메시지 월 — 체크인 여부 무관하게 항상 표시 */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} style={{ color: '#818cf8' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>한 마디 남기기</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#0f0e1c', color: '#818cf8', border: '1px solid #312e81' }}>라이브 월</span>
          </div>
          {sentWallMsg ? (
            <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: '#0f0e1c', border: '1px solid #312e81' }}>
              <span style={{ color: '#818cf8', marginTop: 1 }}>✓</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#818cf8' }}>화면에 게시됐어요!</p>
                <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>"{sentWallMsg}"</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={wallMsg}
                  onChange={e => setWallMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkedIn && sendWallMsg()}
                  placeholder={checkedIn ? '지금 느끼는 한 마디...' : '체크인 후 입력 가능'}
                  maxLength={50}
                  disabled={!checkedIn}
                  className="flex-1 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)',
                    padding: '11px 14px', fontFamily: 'inherit', opacity: checkedIn ? 1 : 0.5 }}
                />
                <button
                  onClick={sendWallMsg}
                  disabled={!checkedIn || !wallMsg.trim() || sendingWall}
                  className="px-4 rounded-xl flex items-center justify-center transition-opacity active:opacity-70 disabled:opacity-30"
                  style={{ background: '#312e81', border: 'none', cursor: checkedIn && wallMsg.trim() ? 'pointer' : 'default' }}
                >
                  <Send size={15} style={{ color: '#818cf8' }} />
                </button>
              </div>
              {!checkedIn && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>I'm in! 버튼을 누른 후 메시지를 남길 수 있어요</p>
              )}
            </>
          )}
        </div>

        {/* 예정 기능 */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#1e1b4b', color: '#818cf8', border: '1px solid #312e81' }}>예정</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Hackday에서 만들어올 기능들</span>
          </div>
          <ComingSoonItem
            title="슬라이드 뷰어"
            desc="발표 슬라이드 실시간 스트리밍 · 딸깍으로 저장 · 그 자리서 Q&A"
          />
          <ComingSoonItem
            title="실시간 자막 · 번역"
            desc="외국인 발표도 걱정 없이 · Live Caption · 전사 저장"
          />
        </div>
      </div>
    </div>
  )
}

function GeoRow({ label, value, flag }: { label: string; value: string; flag?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs font-mono text-right truncate" style={{ color: 'var(--text)' }}>
        {flag && <span className="mr-1">{countryFlag(flag)}</span>}
        {value}
      </span>
    </div>
  )
}

function PresenceScore({ geo, gps, checkedIn }: { geo: GeoInfo; gps: GpsInfo; checkedIn: boolean }) {
  const score =
    (checkedIn ? 40 : 0) +
    (geo.status === 'ok' ? 20 : 0) +
    (gps.status === 'ok' ? 20 : 0)

  const label = score >= 60 ? '인증 완료' : score >= 40 ? '부분 인증' : '미인증'
  const color = score >= 60 ? 'var(--green)' : score >= 40 ? '#facc15' : '#f87171'

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <Wifi size={16} style={{ color }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Presence Score</span>
        <span className="ml-auto text-sm font-bold" style={{ color }}>{score}pt — {label}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <ScorePill label="QR 체크인" pts={40} active={checkedIn} />
        <ScorePill label="GeoIP" pts={20} active={geo.status === 'ok'} />
        <ScorePill label="GPS" pts={20} active={gps.status === 'ok'} />
      </div>
    </div>
  )
}

function ScorePill({ label, pts, active }: { label: string; pts: number; active: boolean }) {
  return (
    <div
      className="rounded-xl py-2 px-1"
      style={{
        background: active ? '#0d2818' : 'var(--bg-card2)',
        border: `1px solid ${active ? 'var(--green-dim)' : 'var(--border)'}`,
      }}
    >
      <div className="text-xs font-bold" style={{ color: active ? 'var(--green)' : 'var(--text-muted)' }}>+{pts}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</div>
    </div>
  )
}

function ComingSoonItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', opacity: 0.75 }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5" style={{ background: '#1e1b4b', color: '#818cf8', border: '1px solid #312e81' }}>준비 중</span>
    </div>
  )
}

function countryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}
