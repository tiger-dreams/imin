import { useState, useEffect, useCallback } from 'react'
import { Trophy, Users, RefreshCw, Play, RotateCcw, Gift, Dices, Star, Drama, Spellcheck2 } from 'lucide-react'

interface ActiveUser {
  userId: string
  displayName: string
  city: string
  country: string
  countryCode: string
  checkedInAt: number
  score?: number
}

type RaffleMethod = 'random' | 'score' | 'chosung' | 'one-by-one'
type RaffleStatus = 'idle' | 'open' | 'drawing' | 'result'

interface RaffleState {
  status: RaffleStatus
  prize: string
  count: number
  method: RaffleMethod
  chosung?: string
  winners?: ActiveUser[]
  pool?: ActiveUser[]
}

const METHOD_OPTIONS: { value: RaffleMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'random',     label: '완전 랜덤',    desc: '참여자 중 무작위 선택',           icon: <Dices size={16} /> },
  { value: 'score',      label: '점수 높은 분', desc: 'Presence Score 상위권 우선',     icon: <Star size={16} /> },
  { value: 'one-by-one', label: '한 명씩 공개', desc: '드라마틱하게 한 명씩 발표',       icon: <Drama size={16} /> },
  { value: 'chosung',    label: '초성 퀴즈',    desc: '정답 맞힌 사람만 추첨 풀 포함',   icon: <Spellcheck2 size={16} /> },
]

export default function AdminPage() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [raffle, setRaffle] = useState<RaffleState>({ status: 'idle', prize: '', count: 1, method: 'random' })
  const [isDrawing, setIsDrawing] = useState(false)

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
    const t = setInterval(fetchUsers, 8000)
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

  const startRaffle = () => pushState({ ...raffle, status: 'open', pool: users, winners: [] })

  const draw = async () => {
    if (isDrawing) return
    setIsDrawing(true)
    await pushState({ ...raffle, status: 'drawing' })
    setTimeout(async () => {
      let pool = [...(raffle.pool ?? users)]
      if (raffle.method === 'score') {
        pool.sort((a, b) => (b.score ?? 40) - (a.score ?? 40))
        pool = pool.slice(0, Math.max(pool.length, raffle.count * 2))
      }
      const winners = [...pool].sort(() => Math.random() - 0.5).slice(0, raffle.count)
      await pushState({ ...raffle, status: 'result', winners, pool })
      setIsDrawing(false)
    }, 2500)
  }

  const reset = () => pushState({ status: 'idle', prize: '', count: 1, method: 'random' })

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

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
                  ? <p style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>초성 &ldquo;{raffle.chosung}&rdquo; 정답자만 추첨 풀에 포함됩니다</p>
                  : <p style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>참여자가 추첨을 기다리고 있습니다</p>}
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
              <div style={{ background: '#18181b', borderRadius: 16, padding: 24, border: '1px solid #713f12' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#facc15' }}>
                  <Trophy size={18} /> 당첨자 {raffle.winners.length}명
                </h2>
                {raffle.prize && <p style={{ textAlign: 'center', fontSize: 13, color: '#facc15', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Gift size={13} />{raffle.prize}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {raffle.winners.map((w, i) => (
                    <div key={w.userId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(250,204,21,0.08)', border: '1px solid #713f12' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#facc15', width: 28 }}>{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#facc15', fontSize: 16 }}>{w.displayName[0]}</div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{w.displayName}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>{countryFlag(w.countryCode)} {w.city}</p>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#a1a1aa' }}>{w.score ?? 40}pt</span>
                    </div>
                  ))}
                </div>
                <button onClick={reset} style={{ width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #27272a', background: '#27272a', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <RotateCcw size={13} /> 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13,
  background: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5',
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

function countryFlag(code: string) {
  return code?.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) ?? ''
}
