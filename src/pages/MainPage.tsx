import { useState } from 'react'
import {
  Trophy, Wifi, CheckCircle, LogOut, ChevronRight, CalendarDays, MessageCircleQuestion,
  HelpCircle, PartyPopper, Info, X, Star,
  MonitorPlay, LayoutGrid, Camera, Send, MessageSquare, ExternalLink, Play, ArrowLeft,
} from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'
import type { LocationData } from './VerifyPage'
import RafflePage from './RafflePage'
import { useHeartbeat } from '../hooks/useHeartbeat'

interface Props {
  location: LocationData
}

type View = 'menu' | 'raffle' | 'slides' | 'wall'
type SlideTab = 'live' | 'slides' | 'photos' | 'qa'

export default function MainPage({ location }: Props) {
  const { profile, logout } = useLiff()
  const [view, setView] = useState<View>('menu')
  const [showScoreTip, setShowScoreTip] = useState(false)
  useHeartbeat(profile?.userId)

  if (view === 'raffle') return <RafflePage location={location} onBack={() => setView('menu')} />
  if (view === 'slides') return <SlidesView onBack={() => setView('menu')} />
  if (view === 'wall') return <WallView profile={profile} onBack={() => setView('menu')} />

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
        <MenuItem icon={<Info size={18} style={{ color: '#64748b' }} />}                title="행사 기타 정보"      desc="장소, 주차, 공지"                  color="#64748b" onClick={soon} />
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
const SLIDE_TABS: { id: SlideTab; label: string; icon: React.ReactNode }[] = [
  { id: 'live',   label: '발표 보기', icon: <MonitorPlay size={14} /> },
  { id: 'slides', label: '슬라이드',  icon: <LayoutGrid size={14} /> },
  { id: 'photos', label: '사진',      icon: <Camera size={14} /> },
  { id: 'qa',     label: 'Q&A',       icon: <MessageCircleQuestion size={14} /> },
]

function SlidesView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<SlideTab>('live')
  const [qaText, setQaText] = useState('')
  const [qaSent, setQaSent] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
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
        {/* Live stream */}
        {activeTab === 'live' && (
          <div>
            <div style={{ aspectRatio: '16/9', background: '#09090b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block',
                  animation: 'livepulse 1.5s ease infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
              </div>
              <MonitorPlay size={48} style={{ color: '#3f3f46' }} />
              <p style={{ fontSize: 14, color: '#52525b', margin: 0 }}>스트리밍 준비 중</p>
              <p style={{ fontSize: 12, color: '#3f3f46', margin: 0 }}>발표가 시작되면 여기서 볼 수 있어요</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              <Play size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>라이브 화면이 시작되면 여기에 표시됩니다</span>
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
                    <span style={{ fontSize: 12, color: i === 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: i === 0 ? 700 : 400, textAlign: 'center' }}>{title}</span>
                  </div>
                  <div style={{ padding: '5px 8px', background: 'var(--bg-card2)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>p.{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#52525b', textAlign: 'center', marginTop: 16 }}>발표 후 전체 슬라이드가 공개될 예정이에요</p>
          </div>
        )}

        {/* Photos */}
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

        {/* Q&A */}
        {activeTab === 'qa' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'LINE LIFF에서 GPS 권한은 어떻게 처리했나요?', votes: 5 },
              { q: 'Redis로 실시간 동기화 구현 방법이 궁금해요', votes: 3 },
              { q: '향후 다른 행사에도 적용할 계획이 있나요?', votes: 7 },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', flexShrink: 0 }}>
                  <span style={{ fontSize: 12 }}>▲</span>
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
                <input
                  value={qaText}
                  onChange={e => setQaText(e.target.value)}
                  placeholder="연사에게 질문을 남겨보세요..."
                  maxLength={80}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 12, fontSize: 13,
                    background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
                    outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={() => { if (qaText.trim()) { setQaSent(true); setQaText('') } }}
                  disabled={!qaText.trim()}
                  style={{ padding: '11px 14px', borderRadius: 12, background: qaText.trim() ? '#0d2818' : '#27272a',
                    border: qaText.trim() ? '1px solid var(--green-dim)' : '1px solid #3f3f46',
                    color: qaText.trim() ? 'var(--green)' : '#52525b', cursor: qaText.trim() ? 'pointer' : 'default' }}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
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
