import { useState, useEffect, useRef } from 'react'
import { Radio } from 'lucide-react'

interface WallMessage {
  id: string
  text: string
  displayName: string
  sentAt: number
}

const COLORS = [
  { bg: '#0a1f0e', border: '#166534', name: '#4ade80' },
  { bg: '#0f0e1c', border: '#312e81', name: '#818cf8' },
  { bg: '#1a1200', border: '#854d0e', name: '#fbbf24' },
  { bg: '#1a0a0a', border: '#7f1d1d', name: '#f87171' },
  { bg: '#0a1520', border: '#1e3a5f', name: '#38bdf8' },
]

const FLOATS = ['float1', 'float2', 'float3', 'float4', 'float5']
const DURATIONS = [4, 5, 6, 7, 5.5, 4.5, 6.5]
const DELAYS = [0, 0.5, 1, 1.5, 2, 0.8, 1.2, 1.8]

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length]
}

function fontSize(text: string) {
  const len = text.length
  if (len <= 8) return 26
  if (len <= 16) return 22
  if (len <= 28) return 18
  if (len <= 42) return 15
  return 13
}

export default function WallPage() {
  const [messages, setMessages] = useState<WallMessage[]>([])
  const [count, setCount] = useState(0)
  const prevIds = useRef(new Set<string>())
  const [newIds, setNewIds] = useState(new Set<string>())

  useEffect(() => {
    let mounted = true

    async function poll() {
      try {
        const res = await fetch('/api/wall-message')
        if (!res.ok || !mounted) return
        const { messages: msgs } = await res.json() as { messages: WallMessage[] }
        const incoming = new Set(msgs.map(m => m.id))
        const fresh = msgs.filter(m => !prevIds.current.has(m.id)).map(m => m.id)
        if (fresh.length > 0) {
          setNewIds(new Set(fresh))
          setTimeout(() => setNewIds(new Set()), 800)
        }
        prevIds.current = incoming
        setMessages(msgs)
        setCount(msgs.length)
      } catch { /* silent */ }
    }

    poll()
    const t = setInterval(poll, 2500)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b', overflow: 'hidden', position: 'relative',
      fontFamily: "'LINE Seed Sans KR', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
    }}>
      {/* ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 60%, rgba(6,199,85,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(129,140,248,0.04) 0%, transparent 55%)' }} />

      {/* header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px',
        background: 'linear-gradient(to bottom, rgba(9,9,11,0.95) 0%, transparent 100%)' }}>
        <img src="/logo.png" alt="imin" style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#52525b' }}>{count}개의 메시지</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20,
            background: '#0d2818', border: '1px solid #166534' }}>
            <Radio size={11} style={{ color: '#4ade80' }} className="pulse-dot" />
            <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* message wall */}
      <div style={{ padding: '80px 32px 40px', position: 'relative', zIndex: 1 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '15vh' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>💬</p>
            <p style={{ fontSize: 20, color: '#3f3f46', fontWeight: 600 }}>아직 메시지가 없어요</p>
            <p style={{ fontSize: 14, color: '#27272a', marginTop: 8 }}>참여자가 체크인 후 메시지를 남기면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignContent: 'flex-start' }}>
            {messages.map((msg, i) => {
              const color = pick(COLORS, i)
              const floatAnim = pick(FLOATS, i + 2)
              const dur = pick(DURATIONS, i + 1)
              const delay = pick(DELAYS, i)
              const isNew = newIds.has(msg.id)
              const fs = fontSize(msg.text)
              const padding = fs >= 22 ? '14px 20px' : '12px 16px'

              return (
                <div key={msg.id}
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    borderRadius: fs >= 22 ? 20 : 14,
                    padding,
                    maxWidth: fs >= 22 ? 260 : 320,
                    animation: isNew
                      ? 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
                      : `${floatAnim} ${dur}s ease-in-out ${delay}s infinite`,
                    cursor: 'default',
                    backdropFilter: 'blur(4px)',
                  }}>
                  <p style={{ margin: 0, fontSize: fs, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                    {msg.text}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: color.name, fontWeight: 600 }}>
                    {msg.displayName}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float1 {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float2 {
          0%,100% { transform: translateY(0px) translateX(0px); }
          40% { transform: translateY(-8px) translateX(5px); }
          70% { transform: translateY(5px) translateX(-4px); }
        }
        @keyframes float3 {
          0%,100% { transform: translateY(0px) rotate(-0.4deg); }
          50% { transform: translateY(-12px) rotate(0.4deg); }
        }
        @keyframes float4 {
          0%,100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.015); }
        }
        @keyframes float5 {
          0%,100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-9px) translateX(3px) rotate(0.3deg); }
          66% { transform: translateY(3px) translateX(-3px) rotate(-0.3deg); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseDot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .pulse-dot { animation: pulseDot 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
