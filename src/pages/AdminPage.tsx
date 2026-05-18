import { useState, useEffect, useCallback } from 'react'
import { Trophy, Users, RefreshCw, Play, RotateCcw, Gift, Dices, Star, Drama, SpellCheck2, MapPin, CheckCircle, XCircle, RefreshCcw } from 'lucide-react'

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

interface RaffleState {
  status: RaffleStatus
  prize: string
  count: number
  method: RaffleMethod
  chosung?: string
  winners?: WinnerEntry[]
  pool?: ActiveUser[]
  allowedCities?: string[]
  confirmDeadline?: number
}

const METHOD_OPTIONS: { value: RaffleMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'random',     label: '완전 랜덤',    desc: '참여자 중 무작위 선택',           icon: <Dices size={16} /> },
  { value: 'score',      label: '점수 높은 분', desc: 'Presence Score 상위권 우선',     icon: <Star size={16} /> },
  { value: 'one-by-one', label: '한 명씩 공개', desc: '드라마틱하게 한 명씩 발표',       icon: <Drama size={16} /> },
  { value: 'chosung',    label: '초성 퀴즈',    desc: '정답 맞힌 사람만 추첨 풀 포함',   icon: <SpellCheck2 size={16} /> },
]

const CONFIRM_WINDOW_MS = 15000

export default function AdminPage() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [raffle, setRaffle] = useState<RaffleState>({ status: 'idle', prize: '', count: 1, method: 'random', allowedCities: [] })
  const [isDrawing, setIsDrawing] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/active')
      if (res.ok) {
        const data = await res.json() as { users: ActiveUser[] }
        setUsers(data.users)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRaffleState = useCallback(async () => {
    const res = await fetch('/api/raffle-state')
    if (res.ok) setRaffle(await res.json() as RaffleState)
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchRaffleState()
    const t = setInterval(() => { fetchUsers(); fetchRaffleState() }, 4000)
    return () => clearInterval(t)
  }, [fetchUsers, fetchRaffleState])

  const pushState = async (state: RaffleState) => {
    await fetch('/api/raffle-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    setRaffle(state)
  }

  const uniqueCities = [...new Set(users.map(u => u.city).filter(Boolean))]

  const toggleCity = (city: string) => {
    setRaffle(r => {
      const cur = r.allowedCities ?? []
      return { ...r, allowedCities: cur.includes(city) ? cur.filter(c => c !== city) : [...cur, city] }
    })
  }

  const filteredPool = (pool: ActiveUser[]) => {
    const cities = raffle.allowedCities ?? []
    if (cities.length === 0) return pool
    return pool.filter(u => cities.includes(u.city))
  }

  const startRaffle = () => {
    const pool = filteredPool(users)
    pushState({ ...raffle, status: 'open', pool, winners: [] })
  }

  const pickWinners = (pool: ActiveUser[], count: number, method: RaffleMethod): ActiveUser[] => {
    let candidates = [...pool]
    if (method === 'score') {
      candidates.sort((a, b) => (b.score ?? 40) - (a.score ?? 40))
      candidates = candidates.slice(0, Math.max(candidates.length, count * 2))
    }
    return [...candidates].sort(() => Math.random() - 0.5).slice(0, count)
  }

  const draw = async () => {
    if (isDrawing) return
    setIsDrawing(true)
    await pushState({ ...raffle, status: 'drawing' })
    setTimeout(async () => {
      const pool = raffle.pool ?? users
      const winners: WinnerEntry[] = pickWinners(pool, raffle.count, raffle.method).map(w => ({ ...w, confirmed: false }))
      await pushState({ ...raffle, status: 'result', winners, pool, confirmDeadline: Date.now() + CONFIRM_WINDOW_MS })
      setIsDrawing(false)
    }, 2500)
  }

  const reroll = async (winnerIdx: number) => {
    const currentWinners = raffle.winners ?? []
    const pool = (raffle.pool ?? []).filter(u => !currentWinners.some(w => w.userId === u.userId))
    if (pool.length === 0) return
    const [replacement] = pickWinners(pool, 1, raffle.method)
    const newWinners = currentWinners.map((w, i) =>
      i === winnerIdx ? { ...replacement, confirmed: false } : w
    )
    await pushState({ ...raffle, winners: newWinners, confirmDeadline: Date.now() + CONFIRM_WINDOW_MS })
  }

  const reset = () => pushState({ status: 'idle', prize: '', count: 1, method: 'random', allowedCities: [] })

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>imin <span style={{ color: '#4ade80' }}>Admin</span></h1>
            <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Tech Week Hackathon Idea Competition KR</p>
          </div>
          <button onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            새로고침
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

          {/* 좌: 활성 접속자 */}
          <div style={{ background: '#18181b', borderRadius: 16, padding: 20, border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} style={{ color: '#4ade80' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>활성 접속자</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{users.length}</span>
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>{u.score ?? 40}pt</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우: 추첨 설정 */}
          <div>
            {raffle.status === 'idle' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #27272a' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>
                  <Trophy size={16} style={{ color: '#facc15' }} /> 추첨 설정
                </h2>

                <Field label="상품">
                  <input value={raffle.prize} onChange={e => setRaffle(r => ({ ...r, prize: e.target.value }))}
                    placeholder="예: 스타벅스 기프티콘" style={inputStyle} />
                </Field>

                <Field label="당첨 인원">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 5].map(n => (
                      <button key={n} onClick={() => setRaffle(r => ({ ...r, count: n }))}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: raffle.count === n ? '#4ade80' : '#27272a', color: raffle.count === n ? '#09090b' : '#a1a1aa' }}>
                        {n}명
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="추첨 방식">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {METHOD_OPTIONS.map(m => (
                      <button key={m.value} onClick={() => setRaffle(r => ({ ...r, method: m.value }))}
                        style={{ padding: 14, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                          background: raffle.method === m.value ? 'rgba(74,222,128,0.08)' : '#27272a',
                          border: raffle.method === m.value ? '1px solid #4ade80' : '1px solid #3f3f46' }}>
                        <div style={{ color: raffle.method === m.value ? '#4ade80' : '#71717a', marginBottom: 6 }}>{m.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: raffle.method === m.value ? '#4ade80' : '#e4e4e7' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {raffle.method === 'chosung' && (
                  <Field label="초성 정답">
                    <input value={raffle.chosung ?? ''} onChange={e => setRaffle(r => ({ ...r, chosung: e.target.value }))}
                      placeholder="예: ㅇㅁ (imin의 초성)" style={inputStyle} />
                  </Field>
                )}

                {/* 지역 필터 */}
                {uniqueCities.length > 0 && (
                  <Field label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} />지역 필터 (비워두면 전체)</span> as unknown as string}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {uniqueCities.map(city => {
                        const selected = (raffle.allowedCities ?? []).includes(city)
                        const count = users.filter(u => u.city === city).length
                        return (
                          <button key={city} onClick={() => toggleCity(city)}
                            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                              background: selected ? '#4ade80' : '#27272a', color: selected ? '#09090b' : '#a1a1aa', fontWeight: selected ? 700 : 400 }}>
                            {city} <span style={{ opacity: 0.7 }}>({count})</span>
                          </button>
                        )
                      })}
                    </div>
                    {(raffle.allowedCities?.length ?? 0) > 0 && (
                      <p style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>
                        선택 지역의 {filteredPool(users).length}명만 추첨 대상
                      </p>
                    )}
                  </Field>
                )}

                <button onClick={startRaffle} disabled={users.length === 0}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: users.length === 0 ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
                    background: users.length === 0 ? '#27272a' : '#4ade80', color: users.length === 0 ? '#52525b' : '#09090b', opacity: users.length === 0 ? 0.5 : 1 }}>
                  <Play size={16} /> 추첨 시작
                </button>
              </div>
            )}

            {raffle.status === 'open' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #166534', textAlign: 'center' }}>
                <Users size={32} style={{ color: '#4ade80', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', margin: '0 0 8px' }}>참여자 대기 중</h2>
                {raffle.method === 'chosung'
                  ? <p style={{ fontSize: 13, color: '#71717a', marginBottom: 4 }}>초성 &ldquo;{raffle.chosung}&rdquo; 정답자만 추첨 풀에 포함됩니다</p>
                  : <p style={{ fontSize: 13, color: '#71717a', marginBottom: 4 }}>참여자가 추첨을 기다리고 있습니다</p>}
                {(raffle.allowedCities?.length ?? 0) > 0 && (
                  <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <MapPin size={11} /> {raffle.allowedCities!.join(', ')} 지역만 대상
                  </p>
                )}
                <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>{raffle.pool?.length ?? 0}<span style={{ fontSize: 16, color: '#71717a', marginLeft: 6 }}>명</span></div>
                {raffle.prize && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#facc15', fontSize: 13, marginBottom: 20 }}><Gift size={14} />{raffle.prize}</div>}
                <button onClick={draw} disabled={isDrawing || (raffle.pool?.length ?? 0) === 0}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#facc15', color: '#09090b', opacity: isDrawing || (raffle.pool?.length ?? 0) === 0 ? 0.4 : 1 }}>
                  <Trophy size={16} /> 지금 추첨!
                </button>
              </div>
            )}

            {raffle.status === 'drawing' && (
              <div style={{ background: '#18181b', borderRadius: 16, padding: 40, border: '1px solid #713f12', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #facc15', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>추첨 중...</p>
              </div>
            )}

            {raffle.status === 'result' && raffle.winners && (
              <ResultPanel
                raffle={raffle}
                now={now}
                onReroll={reroll}
                onReset={reset}
              />
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ResultPanel({ raffle, now, onReroll, onReset }: {
  raffle: RaffleState
  now: number
  onReroll: (idx: number) => void
  onReset: () => void
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
        <RotateCcw size={13} /> 초기화
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

function countryFlag(code: string) {
  return code?.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) ?? ''
}
