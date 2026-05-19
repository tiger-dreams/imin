import { useState, useEffect, useCallback } from 'react'
import {
  MapPin, Wifi, Globe, Trophy, RefreshCw, LogOut, CheckCircle, MessageSquare, Send,
  Info, Play, HelpCircle, Zap, ClipboardList, ExternalLink, Star, X,
  MonitorPlay, LayoutGrid, Camera, MessageCircleQuestion,
} from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'

interface GeoInfo {
  ip: string; city: string; region: string; country: string; countryCode: string
  lat: number; lon: number; isp: string; status: 'loading' | 'ok' | 'error'
}
interface GpsInfo {
  lat: number; lon: number; accuracy: number; status: 'idle' | 'loading' | 'ok' | 'denied' | 'error'
}

type SlideTab = 'live' | 'slides' | 'photos' | 'qa'

export default function CheckInPage() {
  const { profile, logout } = useLiff()
  const [geo, setGeo] = useState<GeoInfo>({ ip: '', city: '', region: '', country: '', countryCode: '', lat: 0, lon: 0, isp: '', status: 'loading' })
  const [gps, setGps] = useState<GpsInfo>({ lat: 0, lon: 0, accuracy: 0, status: 'idle' })
  const [checkedIn, setCheckedIn] = useState(false)
  const [wallMsg, setWallMsg] = useState('')
  const [sentWallMsg, setSentWallMsg] = useState<string | null>(null)
  const [sendingWall, setSendingWall] = useState(false)
  const [showScoreTip, setShowScoreTip] = useState(false)
  const [activeTab, setActiveTab] = useState<SlideTab>('live')
  const [qaText, setQaText] = useState('')
  const [qaSent, setQaSent] = useState(false)

  const score =
    (checkedIn ? 40 : 0) +
    (geo.status === 'ok' ? 20 : 0) +
    (gps.status === 'ok' ? 20 : 0)

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

  const requestGps = () => {
    setGps(prev => ({ ...prev, status: 'loading' }))
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, status: 'ok' }),
      err => setGps(prev => ({ ...prev, status: err.code === 1 ? 'denied' : 'error' })),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

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
            {/* Points badge */}
            <div className="flex items-center gap-1.5 mt-1">
              <Star size={11} style={{ color: '#facc15' }} />
              <span className="text-xs font-bold" style={{ color: '#facc15' }}>{score}pt</span>
              <button onClick={() => setShowScoreTip(true)} className="ml-0.5" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Info size={11} style={{ color: '#52525b' }} />
              </button>
            </div>
          </div>
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

        {/* ── 발표 뷰어 ── */}
        <PresentationViewer activeTab={activeTab} setActiveTab={setActiveTab} qaText={qaText} setQaText={setQaText} qaSent={qaSent} setQaSent={setQaSent} />

        {/* Presence Score */}
        <PresenceScore geo={geo} gps={gps} checkedIn={checkedIn} onInfoClick={() => setShowScoreTip(true)} />

        {/* ── 이벤트 & 설문조사 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <PointCard
            icon={<Zap size={18} style={{ color: '#fb923c' }} />}
            title="이벤트"
            desc="참여하고 포인트 획득"
            pts={50}
            accent="#7c2d12"
            accentLight="#fb923c"
          />
          <PointCard
            icon={<ClipboardList size={18} style={{ color: '#a78bfa' }} />}
            title="설문조사"
            desc="의견 남기고 포인트 획득"
            pts={30}
            accent="#3b0764"
            accentLight="#a78bfa"
          />
        </div>

        {/* 메시지 월 */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} style={{ color: '#818cf8' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>한 마디 남기기</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#0f0e1c', color: '#818cf8', border: '1px solid #312e81' }}>라이브 월</span>
            <a href="/wall" target="_blank" rel="noopener noreferrer"
              title="라이브 월 화면 열기"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8,
                background: '#1e1b4b', border: '1px solid #312e81', color: '#818cf8', textDecoration: 'none', fontSize: 11 }}>
              <ExternalLink size={11} /> 보기
            </a>
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

        {/* GeoIP */}
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

        {/* GPS */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: 'var(--green)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>GPS 위치</span>
          </div>
          {gps.status === 'idle' && (
            <button onClick={requestGps} className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity active:opacity-70" style={{ background: 'var(--green)', color: '#0a0a0a' }}>
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
              <a href={`https://maps.google.com/?q=${gps.lat},${gps.lon}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--green)' }}>
                <MapPin size={12} />지도에서 보기
              </a>
            </div>
          )}
          {gps.status === 'denied' && <p className="text-sm" style={{ color: '#f87171' }}>위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.</p>}
          {gps.status === 'error' && <p className="text-sm" style={{ color: '#f87171' }}>위치 조회 실패. 다시 시도해주세요.</p>}
        </div>
      </div>

      {/* Score Tip Modal */}
      {showScoreTip && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowScoreTip(false)}
        >
          <div
            style={{ width: '100%', background: '#18181b', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', border: '1px solid #27272a', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={18} style={{ color: '#facc15' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Presence Score란?</span>
              </div>
              <button onClick={() => setShowScoreTip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} style={{ color: '#71717a' }} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 20 }}>
              세션에 적극 참여하고 포인트를 쌓으면 <span style={{ color: '#facc15', fontWeight: 700 }}>선물을 교환</span>할 수 있습니다. 현장에 있을수록 높은 점수!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'QR 체크인 (I\'m in!)', pts: 40, color: 'var(--green)', done: checkedIn },
                { label: 'GeoIP 인증', pts: 20, color: 'var(--green)', done: geo.status === 'ok' },
                { label: 'GPS 위치 인증', pts: 20, color: 'var(--green)', done: gps.status === 'ok' },
                { label: '이벤트 참여', pts: 50, color: '#fb923c', done: false, soon: true },
                { label: '설문조사 완료', pts: 30, color: '#a78bfa', done: false, soon: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                  background: item.done ? 'rgba(74,222,128,0.06)' : '#27272a',
                  border: `1px solid ${item.done ? '#166534' : '#3f3f46'}`, opacity: item.soon ? 0.6 : 1 }}>
                  <CheckCircle size={14} style={{ color: item.done ? 'var(--green)' : '#3f3f46', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? '#e4e4e7' : '#71717a' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>+{item.pts}pt</span>
                  {item.soon && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#1e1b4b', color: '#818cf8' }}>예정</span>}
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(250,204,21,0.06)', border: '1px solid #713f12', textAlign: 'center' }}>
              <Trophy size={16} style={{ color: '#facc15', margin: '0 auto 6px' }} />
              <p style={{ fontSize: 13, color: '#facc15', fontWeight: 600, margin: 0 }}>현재 {score}pt — 경품 추첨 & 선물 교환에 활용됩니다</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in { 0%{transform:scale(0.85);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        .animate-bounce-in { animation: bounce-in 0.3s ease forwards; }
      `}</style>
    </div>
  )
}

const SLIDE_TABS: { id: SlideTab; label: string; icon: React.ReactNode }[] = [
  { id: 'live',   label: '발표 보기', icon: <MonitorPlay size={14} /> },
  { id: 'slides', label: '슬라이드',  icon: <LayoutGrid size={14} /> },
  { id: 'photos', label: '사진',      icon: <Camera size={14} /> },
  { id: 'qa',     label: 'Q&A',       icon: <MessageCircleQuestion size={14} /> },
]

function PresentationViewer({ activeTab, setActiveTab, qaText, setQaText, qaSent, setQaSent }: {
  activeTab: SlideTab; setActiveTab: (t: SlideTab) => void
  qaText: string; setQaText: (s: string) => void
  qaSent: boolean; setQaSent: (b: boolean) => void
}) {
  const submitQa = () => {
    if (!qaText.trim()) return
    setQaSent(true)
    setQaText('')
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {SLIDE_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--green)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--green)' : 'var(--text-muted)',
              fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 400 }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live stream */}
      {activeTab === 'live' && (
        <div>
          <div style={{ aspectRatio: '16/9', background: '#09090b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
            </div>
            <MonitorPlay size={40} style={{ color: '#3f3f46' }} />
            <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>스트리밍 준비 중</p>
            <p style={{ fontSize: 11, color: '#3f3f46', margin: 0 }}>발표가 시작되면 여기서 볼 수 있어요</p>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Play size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>imin team — Hackday 발표</span>
          </div>
        </div>
      )}

      {/* Slides */}
      {activeTab === 'slides' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['표지', '문제 정의', '솔루션', '데모', '기술 스택', '팀 소개'].map((title, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '16/9', background: i === 0 ? '#0d2818' : '#27272a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                  <span style={{ fontSize: 11, color: i === 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: i === 0 ? 700 : 400, textAlign: 'center' }}>{title}</span>
                </div>
                <div style={{ padding: '4px 8px', background: 'var(--bg-card2)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>p.{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 12 }}>발표 후 전체 슬라이드 공개 예정</p>
        </div>
      )}

      {/* Photos */}
      {activeTab === 'photos' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: '#27272a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Camera size={18} style={{ color: '#3f3f46' }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 12 }}>행사 사진이 여기 올라올 예정이에요</p>
        </div>
      )}

      {/* Q&A */}
      {activeTab === 'qa' && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Sample questions */}
          {[
            { q: 'LINE LIFF에서 GPS 권한은 어떻게 처리했나요?', votes: 5 },
            { q: 'Redis로 실시간 동기화 구현 방법이 궁금해요', votes: 3 },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#27272a', border: '1px solid #3f3f46', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}>▲</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>{item.votes}</span>
              </button>
              <p style={{ fontSize: 13, color: '#e4e4e7', margin: 0, lineHeight: 1.5 }}>{item.q}</p>
            </div>
          ))}
          {/* Submit Q */}
          {qaSent ? (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(74,222,128,0.06)', border: '1px solid #166534', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--green)', margin: 0 }}>✓ 질문이 등록됐어요!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={qaText}
                onChange={e => setQaText(e.target.value)}
                placeholder="질문을 입력해주세요..."
                maxLength={80}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 13,
                  background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)',
                  outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={submitQa} disabled={!qaText.trim()}
                style={{ padding: '10px 14px', borderRadius: 10, background: qaText.trim() ? '#0d2818' : '#27272a',
                  border: qaText.trim() ? '1px solid var(--green-dim)' : '1px solid #3f3f46',
                  color: qaText.trim() ? 'var(--green)' : '#52525b', cursor: qaText.trim() ? 'pointer' : 'default' }}>
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PointCard({ icon, title, desc, pts, accent, accentLight }: {
  icon: React.ReactNode; title: string; desc: string; pts: number; accent: string; accentLight: string
}) {
  return (
    <div style={{ borderRadius: 16, padding: '16px 14px', background: 'var(--bg-card)',
      border: `1px solid ${accent}`, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon}
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#1e1b4b', color: '#818cf8', border: '1px solid #312e81' }}>예정</span>
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: accentLight }}>{title}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Star size={11} style={{ color: '#facc15' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#facc15' }}>+{pts}pt</span>
      </div>
    </div>
  )
}

function PresenceScore({ geo, gps, checkedIn, onInfoClick }: {
  geo: GeoInfo; gps: GpsInfo; checkedIn: boolean; onInfoClick: () => void
}) {
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
        <button onClick={onInfoClick} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <HelpCircle size={13} style={{ color: '#52525b' }} />
        </button>
        <span className="ml-auto text-sm font-bold" style={{ color }}>{score}pt — {label}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
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
    <div className="rounded-xl py-2 px-1"
      style={{ background: active ? '#0d2818' : 'var(--bg-card2)', border: `1px solid ${active ? 'var(--green-dim)' : 'var(--border)'}` }}>
      <div className="text-xs font-bold" style={{ color: active ? 'var(--green)' : 'var(--text-muted)' }}>+{pts}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</div>
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

function countryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}
