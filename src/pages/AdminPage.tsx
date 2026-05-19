import { useState, useEffect, useCallback } from 'react'
import {
  Trophy, Users, RefreshCw, Play, RotateCcw, Gift, Dices, Star, Drama, SpellCheck2,
  MapPin, CheckCircle, XCircle, RefreshCcw, History, ChevronDown, ChevronUp, Send, Mic,
} from 'lucide-react'

interface ActiveUser {
  userId: string
  displayName: string
  city: string
  country: string
  countryCode: string
  checkedInAt: number
  score?: number
}

interface WinnerEntry extends ActiveUser {
  confirmed?: boolean
}

type RaffleMethod = 'random' | 'score' | 'chosung' | 'one-by-one'
type RaffleStatus = 'idle' | 'open' | 'drawing' | 'result'

// 서버에서 오는 추첨 진행 상태 (폼 필드와 분리)
interface RemoteRaffleState {
  status: RaffleStatus
  prize?: string
  count?: number
  method?: RaffleMethod
  chosung?: string
  winners?: WinnerEntry[]
  pool?: ActiveUser[]
  allowedCities?: string[]
  confirmDeadline?: number
}

// 로컬 폼 설정 (서버 동기화와 무관)
interface FormConfig {
  prize: string
  count: number
  method: RaffleMethod
  chosung: string
  allowedCities: string[]
}

interface HistoryEntry {
  prize: string
  count: number
  method: RaffleMethod
  winners: WinnerEntry[]
  pool: ActiveUser[]
  allowedCities?: string[]
  savedAt: number
}

const METHOD_OPTIONS: { value: RaffleMethod; label: string; desc: string; icon: React.ReactNode; comingSoon?: boolean }[] = [
  { value: 'random',     label: '완전 랜덤',    desc: '참여자 중 무작위 선택',           icon: <Dices size={16} /> },
  { value: 'score',      label: '점수 높은 분', desc: 'Presence Score 상위권 우선',     icon: <Star size={16} /> },
  { value: 'one-by-one', label: '한 명씩 공개', desc: '드라마틱하게 한 명씩 발표',       icon: <Drama size={16} /> },
  { value: 'chosung',    label: '초성 퀴즈',    desc: '정답 맞힌 사람만 추첨 풀 포함',   icon: <SpellCheck2 size={16} /> },
  { value: 'random',     label: '음성 추첨',    desc: '"3명 추첨해줘" 한 마디로 바로',   icon: <Mic size={16} />, comingSoon: true },
]

const CONFIRM_WINDOW_MS = 15000
const DEFAULT_FORM: FormConfig = { prize: '', count: 1, method: 'random', chosung: '', allowedCities: [] }

export default function AdminPage() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [remote, setRemote] = useState<RemoteRaffleState>({ status: 'idle' })
  const [form, setForm] = useState<FormConfig>(DEFAULT_FORM)
  const [isDrawing, setIsDrawing] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/active')
      if (res.ok) setUsers(((await res.json()) as { users: ActiveUser[] }).users)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRemote = useCallback(async () => {
    const res = await fetch('/api/raffle-state', { cache: 'no-store' })
    if (res.ok) {
      const state = await res.json() as RemoteRaffleState
      setRemote(state)
      // 폼 필드는 idle일 때만 초기화 — 진행 중엔 덮어쓰지 않음
      // (의도적으로 서버 상태에서 form을 복원하지 않음)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/raffle-history')
    if (res.ok) setHistory(((await res.json()) as { history: HistoryEntry[] }).history)
  }, [])

  useEffect(() => {
    fetchUsers(); fetchRemote(); fetchHistory()
    const t = setInterval(() => { fetchUsers(); fetchRemote() }, 4000)
    return () => clearInterval(t)
  }, [fetchUsers, fetchRemote, fetchHistory])

  const pushRemote = async (state: RemoteRaffleState) => {
    await fetch('/api/raffle-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    setRemote(state)
  }

  const uniqueCities = [...new Set(users.map(u => u.city).filter(Boolean))]

  const toggleCity = (city: string) =>
    setForm(f => ({ ...f, allowedCities: f.allowedCities.includes(city) ? f.allowedCities.filter(c => c !== city) : [...f.allowedCities, city] }))

  const eligiblePool = (pool: ActiveUser[]) =>
    form.allowedCities.length === 0 ? pool : pool.filter(u => form.allowedCities.includes(u.city))

  const startRaffle = () => {
    const pool = eligiblePool(users)
    pushRemote({ status: 'open', prize: form.prize, count: form.count, method: form.method, chosung: form.chosung, allowedCities: form.allowedCities, pool, winners: [] })
  }

  const pickWinners = (pool: ActiveUser[], count: number, method: RaffleMethod): ActiveUser[] => {
    let candidates = [...pool]
    if (method === 'score') {
      candidates.sort((a, b) => resolveScore(b) - resolveScore(a))
      candidates = candidates.slice(0, Math.max(candidates.length, count * 2))
    }
    return [...candidates].sort(() => Math.random() - 0.5).slice(0, count)
  }

  const draw = async () => {
    if (isDrawing) return
    setIsDrawing(true)
    await pushRemote({ ...remote, status: 'drawing' })
    setTimeout(async () => {
      const pool = remote.pool ?? users
      const winners: WinnerEntry[] = pickWinners(pool, remote.count ?? 1, remote.method ?? 'random').map(w => ({ ...w, confirmed: false }))
      await pushRemote({ ...remote, status: 'result', winners, pool, confirmDeadline: Date.now() + CONFIRM_WINDOW_MS })
      setIsDrawing(false)
    }, 2500)
  }

  const reroll = async (winnerIdx: number) => {
    const currentWinners = remote.winners ?? []
    const pool = (remote.pool ?? []).filter(u => !currentWinners.some(w => w.userId === u.userId))
    if (pool.length === 0) return
    const [replacement] = pickWinners(pool, 1, remote.method ?? 'random')
    const newWinners = currentWinners.map((w, i) => i === winnerIdx ? { ...replacement, confirmed: false } : w)
    await pushRemote({ ...remote, winners: newWinners, confirmDeadline: Date.now() + CONFIRM_WINDOW_MS })
  }

  const reset = async () => {
    // 결과 히스토리 저장
    if (remote.status === 'result' && remote.winners && remote.winners.length > 0) {
      await fetch('/api/raffle-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prize: remote.prize, count: remote.count, method: remote.method,
          winners: remote.winners, pool: remote.pool, allowedCities: remote.allowedCities,
        }),
      })
      fetchHistory()
    }
    await pushRemote({ status: 'idle' })
    // 폼은 유지 — 사용자가 원할 때만 직접 수정
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: 'Inter, sans-serif' }} className="admin-root">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <img src="/logo.png" alt="imin" style={{ height: 32, filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: 13, color: '#71717a', marginTop: 6, marginBottom: 0 }}>Tech Week Hackathon Idea Competition KR</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowHistory(h => !h); if (!showHistory) fetchHistory() }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: showHistory ? '#27272a' : '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>
              <History size={13} /> 기록
            </button>
            <button onClick={fetchUsers}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>
              <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              새로고침
            </button>
          </div>
        </div>

        {/* 히스토리 패널 */}
        {showHistory && (
          <div style={{ background: '#18181b', borderRadius: 16, padding: 20, border: '1px solid #27272a', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <History size={14} style={{ color: '#a1a1aa' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>추첨 기록</span>
              <span style={{ fontSize: 12, color: '#52525b' }}>최근 {history.length}건</span>
            </div>
            {history.length === 0
              ? <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', padding: '16px 0' }}>추첨 기록이 없습니다</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map((h, i) => <HistoryCard key={i} entry={h} />)}
                </div>
            }
          </div>
        )}

        <div className="admin-grid">

          {/* 좌: 활성 접속자 */}
          <div style={{ background: '#18181b', borderRadius: 16, padding: 20, border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} style={{ color: '#4ade80' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>활성 접속자</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{users.length}</span>
            </div>
            <div className="user-list" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.length === 0 && <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', padding: '20px 0' }}>접속자 없음</p>}
              {users.map(u => (
                <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#27272a' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4ade80', fontSize: 14, flexShrink: 0 }}>
                    {u.displayName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName}</p>
                    <p style={{ fontSize: 11, color: '#71717a', margin: 0 }}>{countryFlag(u.countryCode)} {u.city}</p>
                  </div>
                  <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>{resolveScore(u)}pt</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우: 추첨 패널 */}
          <div>
            {remote.status === 'idle' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #27272a' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>
                  <Trophy size={16} style={{ color: '#facc15' }} /> 추첨 설정
                </h2>

                <Field label="상품">
                  <input value={form.prize} onChange={e => setForm(f => ({ ...f, prize: e.target.value }))}
                    placeholder="예: 스타벅스 기프티콘 5만원" style={inputStyle} />
                  {form.prize && Number(form.prize.replace(/[^0-9]/g, '')) >= 50000 && (
                    <p style={{ fontSize: 11, color: '#facc15', marginTop: 6 }}>50,000원 이상 — 당첨자 제세공과금 정보 수집 필요</p>
                  )}
                </Field>

                <Field label="당첨 인원">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 5].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, count: n }))}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: form.count === n ? '#4ade80' : '#27272a', color: form.count === n ? '#09090b' : '#a1a1aa' }}>
                        {n}명
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="추첨 방식">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {METHOD_OPTIONS.map((m, idx) => m.comingSoon ? (
                      <div key={`${m.value}-${idx}`}
                        style={{ padding: 14, borderRadius: 12, textAlign: 'left', position: 'relative',
                          background: '#18181b', border: '1px solid #27272a', opacity: 0.6, cursor: 'not-allowed' }}>
                        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 20, background: '#1e1b4b', color: '#818cf8', border: '1px solid #312e81' }}>
                          예정
                        </div>
                        <div style={{ color: '#52525b', marginBottom: 6 }}>{m.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#52525b', marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
                      </div>
                    ) : (
                      <button key={`${m.value}-${idx}`} onClick={() => setForm(f => ({ ...f, method: m.value }))}
                        style={{ padding: 14, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                          background: form.method === m.value ? 'rgba(74,222,128,0.08)' : '#27272a',
                          border: form.method === m.value ? '1px solid #4ade80' : '1px solid #3f3f46' }}>
                        <div style={{ color: form.method === m.value ? '#4ade80' : '#71717a', marginBottom: 6 }}>{m.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: form.method === m.value ? '#4ade80' : '#e4e4e7' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {form.method === 'chosung' && (
                  <Field label="초성 정답">
                    <input value={form.chosung} onChange={e => setForm(f => ({ ...f, chosung: e.target.value }))}
                      placeholder="예: ㅇㅁ (imin의 초성)" style={inputStyle} />
                  </Field>
                )}

                {uniqueCities.length > 0 && (
                  <Field label={<><MapPin size={11} style={{ marginRight: 4 }} />지역 필터 (비워두면 전체)</>}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {uniqueCities.map(city => {
                        const selected = form.allowedCities.includes(city)
                        const cnt = users.filter(u => u.city === city).length
                        return (
                          <button key={city} onClick={() => toggleCity(city)}
                            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                              background: selected ? '#4ade80' : '#27272a', color: selected ? '#09090b' : '#a1a1aa', fontWeight: selected ? 700 : 400 }}>
                            {city} <span style={{ opacity: 0.7 }}>({cnt})</span>
                          </button>
                        )
                      })}
                    </div>
                    {form.allowedCities.length > 0 && (
                      <p style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>
                        선택 지역의 {eligiblePool(users).length}명만 추첨 대상
                      </p>
                    )}
                  </Field>
                )}

                <button onClick={startRaffle} disabled={users.length === 0 || !form.prize.trim()}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
                    cursor: users.length === 0 || !form.prize.trim() ? 'not-allowed' : 'pointer',
                    background: users.length === 0 || !form.prize.trim() ? '#27272a' : '#4ade80',
                    color: users.length === 0 || !form.prize.trim() ? '#52525b' : '#09090b',
                    opacity: users.length === 0 || !form.prize.trim() ? 0.5 : 1 }}>
                  <Play size={16} /> 추첨 공지 안내
                </button>
                {!form.prize.trim() && <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 8 }}>상품명을 입력해야 시작할 수 있습니다</p>}
              </div>
            )}

            {remote.status === 'open' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #166534', textAlign: 'center' }}>
                <Users size={32} style={{ color: '#4ade80', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', margin: '0 0 8px' }}>참여자 대기 중</h2>
                {remote.method === 'chosung'
                  ? <p style={{ fontSize: 13, color: '#71717a', marginBottom: 4 }}>초성 &ldquo;{remote.chosung}&rdquo; 정답자만 추첨 풀에 포함됩니다</p>
                  : <p style={{ fontSize: 13, color: '#71717a', marginBottom: 4 }}>참여자가 추첨을 기다리고 있습니다</p>}
                {(remote.allowedCities?.length ?? 0) > 0 && (
                  <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <MapPin size={11} /> {remote.allowedCities!.join(', ')} 지역만 대상
                  </p>
                )}
                <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>{remote.pool?.length ?? 0}<span style={{ fontSize: 16, color: '#71717a', marginLeft: 6 }}>명</span></div>
                {remote.prize && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#facc15', fontSize: 13, marginBottom: 20 }}><Gift size={14} />{remote.prize}</div>}
                <button onClick={draw} disabled={isDrawing || (remote.pool?.length ?? 0) === 0}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#facc15', color: '#09090b', opacity: isDrawing || (remote.pool?.length ?? 0) === 0 ? 0.4 : 1 }}>
                  <Trophy size={16} /> 지금 추첨!
                </button>
              </div>
            )}

            {remote.status === 'drawing' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 40, border: '1px solid #713f12', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #facc15', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>추첨 중...</p>
              </div>
            )}

            {remote.status === 'result' && remote.winners && (
              <ResultPanel raffle={remote} now={now} onReroll={reroll} onReset={reset} />
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          align-items: start;
        }
        .user-list { max-height: 520px; }
        @media (max-width: 768px) {
          .admin-root { font-size: 14px; }
          .admin-root > div { padding: 16px !important; }
          .admin-grid { grid-template-columns: 1fr; }
          .user-list { max-height: 260px; }
        }
      `}</style>
    </div>
  )
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const date = new Date(entry.savedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const confirmed = entry.winners.filter(w => w.confirmed).length

  const sendMsg = async (userId: string) => {
    if (sending) return
    setSending(userId)
    try {
      await fetch('/api/raffle-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prize: entry.prize }),
      })
    } finally {
      setSending(null)
    }
  }

  return (
    <div style={{ borderRadius: 10, background: '#27272a', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#f4f4f5', textAlign: 'left' }}>
        <Trophy size={13} style={{ color: '#facc15', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{entry.prize || '(상품 없음)'}</span>
        <span style={{ fontSize: 11, color: '#71717a' }}>{date}</span>
        <span style={{ fontSize: 11, color: '#4ade80' }}>{confirmed}/{entry.winners.length}명 확인</span>
        {open ? <ChevronUp size={13} style={{ color: '#52525b' }} /> : <ChevronDown size={13} style={{ color: '#52525b' }} />}
      </button>
      {open && (
        <div style={{ borderTop: '1px solid #3f3f46', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.winners.map((w, i) => (
            <div key={w.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: '#facc15', width: 16 }}>{i + 1}</span>
              <span style={{ flex: 1, color: '#e4e4e7' }}>{w.displayName}</span>
              <span style={{ color: '#71717a' }}>{countryFlag(w.countryCode)} {w.city}</span>
              {w.confirmed
                ? <CheckCircle size={12} style={{ color: '#4ade80' }} />
                : <XCircle size={12} style={{ color: '#f87171' }} />}
              <button
                onClick={() => sendMsg(w.userId)}
                disabled={sending === w.userId}
                title="LINE 메시지 발송"
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid #3f3f46', background: '#18181b', color: sending === w.userId ? '#52525b' : '#a1a1aa' }}>
                <Send size={10} /> {sending === w.userId ? '발송 중' : '발송'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultPanel({ raffle, now, onReroll, onReset }: {
  raffle: RemoteRaffleState; now: number; onReroll: (idx: number) => void; onReset: () => void
}) {
  const deadline = raffle.confirmDeadline ?? 0
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  const expired = now > deadline

  return (
    <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #713f12' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: '#facc15' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={18} /> 당첨자 {raffle.winners!.length}명</span>
        {!expired && <span style={{ fontSize: 14, color: remaining <= 5 ? '#f87171' : '#a1a1aa', fontVariantNumeric: 'tabular-nums' }}>확인 {remaining}s</span>}
      </h2>
      {raffle.prize && <p style={{ textAlign: 'center', fontSize: 13, color: '#facc15', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Gift size={13} />{raffle.prize}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {raffle.winners!.map((w, i) => {
          const canReroll = expired && !w.confirmed
          return (
            <div key={w.userId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
              background: w.confirmed ? 'rgba(74,222,128,0.08)' : 'rgba(250,204,21,0.08)',
              border: `1px solid ${w.confirmed ? '#166534' : '#713f12'}` }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#facc15', width: 28 }}>{i + 1}</span>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#facc15', fontSize: 16 }}>{w.displayName[0]}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{w.displayName}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>{countryFlag(w.countryCode)} {w.city}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {w.confirmed
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80', fontWeight: 600 }}><CheckCircle size={14} />확인 완료</span>
                  : expired
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f87171' }}><XCircle size={14} />미응답</span>
                    : <span style={{ fontSize: 12, color: '#facc15', fontVariantNumeric: 'tabular-nums' }}>{remaining}s</span>
                }
                {canReroll && (
                  <button onClick={() => onReroll(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #3f3f46', background: '#27272a', color: '#a1a1aa' }}>
                    <RefreshCcw size={12} /> Reroll
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onReset} style={{ width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #27272a', background: '#27272a', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <RotateCcw size={13} /> 다음 추첨으로
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13,
  background: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5',
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

function resolveScore(u: { score?: number; gpsLat?: number }) {
  return u.score ?? (40 + 20 + (u.gpsLat ? 20 : 0))
}

function countryFlag(code: string) {
  return code?.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) ?? ''
}
