import { useState, useEffect, useRef } from 'react'
import {
  Trophy, Wifi, CheckCircle, LogOut, ChevronRight, CalendarDays, MessageCircleQuestion,
  HelpCircle, PartyPopper, Info, X, Star,
  MonitorPlay, LayoutGrid, Camera, Send, MessageSquare, ExternalLink, Play, Pause,
  ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon,
  Sparkles, Users, Lightbulb, Clock,
} from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'
import type { LocationData } from './VerifyPage'
import RafflePage from './RafflePage'
import { useHeartbeat } from '../hooks/useHeartbeat'

interface Props {
  location: LocationData
}

type View = 'menu' | 'raffle' | 'slides' | 'wall' | 'info'
type SlideTab = 'live' | 'slides' | 'photos' | 'qa'

export default function MainPage({ location }: Props) {
  const { profile, logout } = useLiff()
  const [view, setView] = useState<View>('menu')
  const [showScoreTip, setShowScoreTip] = useState(false)
  useHeartbeat(profile?.userId)

  if (view === 'raffle') return <RafflePage location={location} onBack={() => setView('menu')} />
  if (view === 'slides') return <SlidesView onBack={() => setView('menu')} />
  if (view === 'wall') return <WallView profile={profile} onBack={() => setView('menu')} />
  if (view === 'info') return <InfoView onBack={() => setView('menu')} />

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
        <PresenceBar location={location} onInfoClick={() => setShowScoreTip(true)} />

        {/* 메뉴 */}
        <p className="text-xs font-semibold px-1 pt-1" style={{ color: 'var(--text-muted)' }}>FEATURES</p>

        <MenuItem icon={<Trophy size={18} style={{ color: '#facc15' }} />}              title="활성 세션 추첨"      desc="지금 앱을 열고 있는 사람만 대상"  color="#facc15" onClick={() => setView('raffle')} />
        <MenuItem icon={<MonitorPlay size={18} style={{ color: '#a78bfa' }} />}         title="발표 슬라이드"       desc="라이브 스트리밍 · 슬라이드 · Q&A" color="#a78bfa" onClick={() => setView('slides')} />
        <MenuItem icon={<MessageSquare size={18} style={{ color: '#818cf8' }} />}       title="메시지 월"           desc="한 마디 남기고 화면에서 보기"      color="#818cf8" onClick={() => setView('wall')} />
        <MenuItem icon={<CalendarDays size={18} style={{ color: '#60a5fa' }} />}        title="타임 테이블"         desc="세션 일정 보기"                    color="#60a5fa" onClick={soon} />
        <MenuItem icon={<PartyPopper size={18} style={{ color: '#fb923c' }} />}         title="이벤트"              desc="현장 이벤트 참여 · 포인트 획득"   color="#fb923c" onClick={soon} />
        <MenuItem icon={<HelpCircle size={18} style={{ color: '#34d399' }} />}          title="주최 측에 문의하기"  desc="운영진에게 바로 연락"              color="#34d399" onClick={soon} />
        <MenuItem icon={<Wifi size={18} style={{ color: '#94a3b8' }} />}                title="WiFi 비밀번호"       desc="탭하면 클립보드에 복사"            color="#94a3b8"
          onClick={() => { navigator.clipboard?.writeText('hackday!'); alert('복사됐어요: hackday!') }} />
        <MenuItem icon={<Info size={18} style={{ color: '#64748b' }} />}                title="About imin"           desc="만든 사람들 · 로드맵"              color="#64748b" onClick={() => setView('info')} />
      </div>

      {/* Score Tip Modal */}
      {showScoreTip && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowScoreTip(false)}
        >
          <div
            style={{ width: '100%', background: '#18181b', borderRadius: '20px 20px 0 0', padding: '24px 20px 48px', border: '1px solid #27272a', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={18} style={{ color: '#facc15' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Presence Score란?</span>
              </div>
              <button onClick={() => setShowScoreTip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} style={{ color: '#71717a' }} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 16 }}>
              세션에 적극 참여하고 포인트를 쌓으면 <span style={{ color: '#facc15', fontWeight: 700 }}>선물을 교환</span>할 수 있어요. 현장에 있을수록 높은 점수!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'QR 체크인 (I\'m in!)', pts: 40, color: 'var(--green)', done: true },
                { label: 'GeoIP 인증', pts: 20, color: 'var(--green)', done: location.score >= 60 },
                { label: 'GPS 위치 인증', pts: 20, color: 'var(--green)', done: !!location.gpsLat },
                { label: '이벤트 참여', pts: 50, color: '#fb923c', done: false, soon: true },
                { label: '설문조사 완료', pts: 30, color: '#a78bfa', done: false, soon: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
                  background: item.done ? 'rgba(74,222,128,0.06)' : '#27272a',
                  border: `1px solid ${item.done ? '#166534' : '#3f3f46'}`, opacity: item.soon ? 0.65 : 1 }}>
                  <CheckCircle size={14} style={{ color: item.done ? 'var(--green)' : '#3f3f46', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? '#e4e4e7' : '#71717a' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>+{item.pts}pt</span>
                  {item.soon && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#1e1b4b', color: '#818cf8' }}>예정</span>}
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(250,204,21,0.06)', border: '1px solid #713f12', textAlign: 'center' }}>
              <Trophy size={14} style={{ color: '#facc15', display: 'inline', marginRight: 6 }} />
              <span style={{ fontSize: 13, color: '#facc15', fontWeight: 600 }}>현재 {location.score}pt — 경품 추첨 & 선물 교환에 활용됩니다</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 발표 뷰어 페이지 ────────────────────────────────────────────
const TOTAL_SLIDES = 5
const AUTO_INTERVAL = 5000  // 5초 자동 넘김

const SLIDE_TABS: { id: SlideTab; label: string; icon: React.ReactNode }[] = [
  { id: 'live',   label: '발표 보기', icon: <MonitorPlay size={14} /> },
  { id: 'slides', label: '슬라이드',  icon: <LayoutGrid size={14} /> },
  { id: 'photos', label: '사진',      icon: <Camera size={14} /> },
  { id: 'qa',     label: 'Q&A',       icon: <MessageCircleQuestion size={14} /> },
]

function SlidesView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<SlideTab>('live')
  const [current, setCurrent] = useState(0)             // 0-based index
  const [playing, setPlaying] = useState(true)
  const [qaText, setQaText] = useState('')
  const [qaSent, setQaSent] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 자동 슬라이드쇼
  useEffect(() => {
    if (!playing || activeTab !== 'live') { timerRef.current && clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % TOTAL_SLIDES), AUTO_INTERVAL)
    return () => { timerRef.current && clearInterval(timerRef.current) }
  }, [playing, activeTab])

  const go = (idx: number) => {
    setCurrent(idx)
    // 수동 이동 시 타이머 리셋
    if (timerRef.current) { clearInterval(timerRef.current) }
    if (playing) {
      timerRef.current = setInterval(() => setCurrent(c => (c + 1) % TOTAL_SLIDES), AUTO_INTERVAL)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button onClick={onBack} style={{ background: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div>
          <p className="font-bold text-base" style={{ color: 'var(--text)', margin: 0 }}>발표 슬라이드</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>imin team — Hackday 발표</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
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

      <div className="flex-1 overflow-y-auto">

        {/* ── 발표 보기: 자동 슬라이드쇼 ── */}
        {activeTab === 'live' && (
          <div>
            {/* 슬라이드 이미지 */}
            <div style={{ position: 'relative', background: '#000', lineHeight: 0 }}>
              <img
                key={current}
                src={`/slides/slide-${current + 1}.jpg`}
                alt={`slide ${current + 1}`}
                style={{ width: '100%', display: 'block', transition: 'opacity 0.4s ease', opacity: 1 }}
              />
              {/* Prev / Next 오버레이 */}
              <button onClick={() => go((current - 1 + TOTAL_SLIDES) % TOTAL_SLIDES)}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '25%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 8 }}>
                <span style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '6px 7px', display: 'flex' }}>
                  <ChevronLeft size={18} style={{ color: '#fff' }} />
                </span>
              </button>
              <button onClick={() => go((current + 1) % TOTAL_SLIDES)}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '25%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                <span style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '6px 7px', display: 'flex' }}>
                  <ChevronRightIcon size={18} style={{ color: '#fff' }} />
                </span>
              </button>
            </div>

            {/* 컨트롤바 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              {/* 자동재생 토글 */}
              <button onClick={() => setPlaying(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20,
                  background: playing ? 'rgba(74,222,128,0.1)' : '#27272a',
                  border: playing ? '1px solid var(--green-dim)' : '1px solid #3f3f46',
                  color: playing ? 'var(--green)' : '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {playing ? <><Pause size={12} /> 자동</>  : <><Play size={12} /> 자동</>}
              </button>
              {/* 인디케이터 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                  <button key={i} onClick={() => go(i)}
                    style={{ width: i === current ? 20 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s',
                      background: i === current ? 'var(--green)' : '#3f3f46' }} />
                ))}
              </div>
              {/* 페이지 */}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{current + 1} / {TOTAL_SLIDES}</span>
            </div>

            {/* 진행 바 (자동재생 중일 때) */}
            {playing && (
              <div style={{ height: 2, background: 'var(--border)' }}>
                <div key={`${current}-${playing}`} style={{ height: '100%', background: 'var(--green)',
                  animation: `slideprog ${AUTO_INTERVAL}ms linear` }} />
              </div>
            )}
          </div>
        )}

        {/* ── 슬라이드 그리드 ── */}
        {activeTab === 'slides' && (
          <div style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                <button key={i} onClick={() => { setActiveTab('live'); go(i) }}
                  style={{ borderRadius: 10, overflow: 'hidden', border: i === current ? '2px solid var(--green)' : '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 0 }}>
                  <img src={`/slides/slide-${i + 1}.jpg`} alt={`slide ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                  <div style={{ padding: '5px 8px', background: 'var(--bg-card2)', textAlign: 'left' }}>
                    <span style={{ fontSize: 10, color: i === current ? 'var(--green)' : 'var(--text-muted)', fontWeight: i === current ? 700 : 400 }}>
                      {i === current ? '▶ ' : ''}p.{i + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 사진 ── */}
        {activeTab === 'photos' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: '#27272a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <Camera size={20} style={{ color: '#3f3f46' }} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#52525b', textAlign: 'center', marginTop: 16 }}>행사 사진이 여기에 올라올 예정이에요</p>
          </div>
        )}

        {/* ── Q&A ── */}
        {activeTab === 'qa' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'LINE LIFF에서 GPS 권한은 어떻게 처리했나요?', votes: 5 },
              { q: 'Redis로 실시간 동기화 구현 방법이 궁금해요', votes: 3 },
              { q: '향후 다른 행사에도 적용할 계획이 있나요?', votes: 7 },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#71717a' }}>▲</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{item.votes}</span>
                </button>
                <p style={{ fontSize: 13, color: '#e4e4e7', margin: 0, lineHeight: 1.5 }}>{item.q}</p>
              </div>
            ))}
            {qaSent ? (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(74,222,128,0.06)', border: '1px solid #166534', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--green)', margin: 0 }}>✓ 질문이 등록됐어요!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={qaText} onChange={e => setQaText(e.target.value)}
                  placeholder="연사에게 질문을 남겨보세요..." maxLength={80}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 12, fontSize: 13,
                    background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
                    outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={() => { if (qaText.trim()) { setQaSent(true); setQaText('') } }}
                  disabled={!qaText.trim()}
                  style={{ padding: '11px 14px', borderRadius: 12,
                    background: qaText.trim() ? '#0d2818' : '#27272a',
                    border: qaText.trim() ? '1px solid var(--green-dim)' : '1px solid #3f3f46',
                    color: qaText.trim() ? 'var(--green)' : '#52525b', cursor: qaText.trim() ? 'pointer' : 'default' }}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideprog { from { width: 0% } to { width: 100% } }
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}

// ── 메시지 월 페이지 ────────────────────────────────────────────
function WallView({ profile, onBack }: { profile: { userId?: string; displayName?: string; pictureUrl?: string } | null; onBack: () => void }) {
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const sendMsg = async () => {
    if (!msg.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/wall-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.trim(), displayName: profile?.displayName, userId: profile?.userId }),
      })
      setSent(msg.trim())
      setMsg('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} style={{ background: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ color: 'var(--text)', margin: 0 }}>메시지 월</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>한 마디 남기고 라이브 화면에서 보기</p>
        </div>
        <a href="/wall" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10,
            background: '#1e1b4b', border: '1px solid #312e81', color: '#818cf8', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
          <ExternalLink size={12} /> 화면 열기
        </a>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 미리보기 */}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#09090b', border: '1px solid #1e1b4b', padding: 20, minHeight: 160,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600 }}>LIVE WALL</span>
          </div>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#818cf8', margin: 0, lineHeight: 1.4 }}>"{sent}"</p>
              <p style={{ fontSize: 12, color: '#52525b', marginTop: 8 }}>— {profile?.displayName ?? '나'}</p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#3f3f46', margin: 0, textAlign: 'center' }}>메시지를 보내면<br />라이브 화면에 표시됩니다</p>
          )}
        </div>

        {/* 입력 */}
        {sent ? (
          <div style={{ borderRadius: 16, padding: '20px', background: 'var(--bg-card)', border: '1px solid #312e81', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#818cf8', fontWeight: 700, margin: '0 0 8px' }}>✓ 화면에 게시됐어요!</p>
            <button onClick={() => setSent(null)}
              style={{ fontSize: 12, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              다른 메시지 보내기
            </button>
          </div>
        ) : (
          <div style={{ borderRadius: 16, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="지금 느끼는 한 마디..."
              maxLength={50}
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, resize: 'none',
                background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#52525b' }}>{msg.length}/50자</span>
              <button onClick={sendMsg} disabled={!msg.trim() || sending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: msg.trim() ? '#312e81' : '#27272a', border: 'none',
                  color: msg.trim() ? '#818cf8' : '#52525b', cursor: msg.trim() ? 'pointer' : 'default' }}>
                {sending ? '전송 중...' : <><Send size={13} /> 라이브 월에 올리기</>}
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessageSquare size={18} style={{ color: '#818cf8', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            행사장 대형 화면에 실시간으로 표시됩니다. 부적절한 메시지는 운영진이 삭제할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── 공통 컴포넌트 ────────────────────────────────────────────────
function MenuItem({ icon, title, desc, color, onClick }: {
  icon: React.ReactNode; title: string; desc: string; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl p-4 flex items-center gap-4 text-left active:opacity-70 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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

// ── 기타 정보 / About 페이지 ─────────────────────────────────────
const TEAM = [
  { name: '정덕범', role: 'VoIP Platform Dev', photo: '/team/tiger.jpg' },
  { name: '최승범', role: 'AI Product Strategy', photo: '/team/seungbeom.jpg' },
  { name: '김진선', role: 'Creative PM', photo: '/team/jinseun.jpg' },
]

const ROADMAP: { status: 'done' | 'wip' | 'planned'; label: string; desc: string }[] = [
  { status: 'done',    label: 'QR 체크인 + Presence Score',       desc: 'LINE LIFF 기반 위치 인증 시스템' },
  { status: 'done',    label: '경품 추첨',                          desc: '기프티콘 모드, 실시간 당첨 알림' },
  { status: 'done',    label: '메시지 월',                          desc: '실시간 라이브 스크린 메시지' },
  { status: 'done',    label: '발표 슬라이드 뷰어',                  desc: '자동 슬라이드쇼 · 그리드 보기' },
  { status: 'wip',     label: '전체 발송 (Blast Message)',          desc: '활성 유저 or LINE 전체 팔로워 대상' },
  { status: 'planned', label: '타임 테이블',                        desc: '세션 일정 · 스피커 정보 연동' },
  { status: 'planned', label: '실시간 Q&A',                        desc: '청중 질문 업보트 · 발표자 화면 연동' },
  { status: 'planned', label: '이벤트 & 설문조사',                   desc: '포인트 적립 → 선물 교환' },
  { status: 'planned', label: '실시간 자막 · 번역',                  desc: 'Live Caption · 외국어 발표 자막' },
  { status: 'planned', label: '네트워킹 매칭',                      desc: '관심사 기반 참가자 연결' },
  { status: 'planned', label: '행사 사진 갤러리',                    desc: '현장 사진 업로드 & 공유' },
  { status: 'planned', label: '글로벌 다국어 지원',                  desc: 'EN · JA · KO 자동 전환' },
]

const STATUS_META = {
  done:    { label: '완료',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: '#166534' },
  wip:     { label: '진행',  color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: '#713f12' },
  planned: { label: '예정',  color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: '#312e81' },
}

function InfoView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} style={{ background: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div>
          <p className="font-bold text-base" style={{ color: 'var(--text)', margin: 0 }}>About imin</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>만든 사람들 · 로드맵</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* imin 소개 */}
        <div style={{ borderRadius: 20, padding: '24px 20px', background: 'var(--bg-card)', border: '1px solid var(--green-dim)', textAlign: 'center' }}>
          <img src="/logo.png" alt="imin" style={{ height: 32, filter: 'brightness(0) invert(1)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--green)' }}>I'm in</strong> — 지금 여기, 이 자리에 있는 사람만.<br />
            행사 참여 경험을 더 풍부하게 만들기 위한<br />LINE LIFF 기반 이벤트 플랫폼입니다.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#0d2818', color: 'var(--green)', border: '1px solid var(--green-dim)' }}>
              LINE LIFF
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#1e1b4b', color: '#818cf8', border: '1px solid #312e81' }}>
              Hackday 2025
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#27272a', color: '#71717a', border: '1px solid #3f3f46' }}>
              Tech Week KR
            </span>
          </div>
        </div>

        {/* 만든 사람들 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Users size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>만든 사람들</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEAM.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <img
                  src={t.photo}
                  alt={t.name}
                  style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover', flexShrink: 0, background: '#27272a' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 로드맵 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Lightbulb size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>로드맵</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROADMAP.map((item, i) => {
              const meta = STATUS_META[item.status]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16,
                  background: item.status === 'done' ? 'rgba(74,222,128,0.04)' : 'var(--bg-card)',
                  border: `1px solid ${item.status === 'done' ? '#1a3a26' : 'var(--border)'}` }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    {item.status === 'done'
                      ? <CheckCircle size={15} style={{ color: '#4ade80' }} />
                      : item.status === 'wip'
                        ? <Clock size={15} style={{ color: '#facc15' }} />
                        : <Sparkles size={15} style={{ color: '#818cf8' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: item.status === 'done' ? '#e4e4e7' : 'var(--text)' }}>{item.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
                    background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 버전 */}
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <p style={{ fontSize: 11, color: '#3f3f46', margin: 0 }}>imin v0.1 · Hackday 2025 · LINE Planet VoIP</p>
          <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 4 }}>Built with LINE LIFF · React · Vercel · Upstash Redis</p>
        </div>

      </div>
    </div>
  )
}

function PresenceBar({ location, onInfoClick }: { location: LocationData; onInfoClick: () => void }) {
  const score = location.score
  const label = score >= 60 ? '인증 완료' : '부분 인증'
  const color = score >= 60 ? 'var(--green)' : '#facc15'
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Presence Score</span>
          <button onClick={onInfoClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Info size={12} style={{ color: '#52525b' }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={12} style={{ color: '#facc15' }} />
          <span className="text-xs font-bold" style={{ color }}>{score}pt — {label}</span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card2)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}
