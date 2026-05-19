import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Trash2, RefreshCw, RotateCcw, ExternalLink, ChevronLeft } from 'lucide-react'

interface WallMessage {
  id: string
  text: string
  displayName: string
  sentAt: number
}

export default function AdminWallPage() {
  const [messages, setMessages] = useState<WallMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wall-message')
      if (res.ok) setMessages(((await res.json()) as { messages: WallMessage[] }).messages)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const t = setInterval(fetch_, 5000)
    return () => clearInterval(t)
  }, [fetch_])

  const clearAll = async () => {
    if (!confirm('모든 메시지를 삭제할까요?')) return
    setClearing(true)
    await fetch('/api/wall-message', { method: 'DELETE' })
    setMessages([])
    setClearing(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <a href="/admin" style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: 10,
            background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', textDecoration: 'none' }}>
            <ChevronLeft size={16} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <MessageSquare size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>메시지 월</span>
            <span style={{ fontSize: 13, color: '#52525b' }}>{messages.length}개</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/wall" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10,
                background: '#18181b', border: '1px solid #312e81', color: '#818cf8', fontSize: 12,
                textDecoration: 'none', fontWeight: 500 }}>
              <ExternalLink size={12} /> 공개 화면
            </a>
            <button onClick={fetch_}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10,
                background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>
              <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> 새로고침
            </button>
            <button onClick={clearAll} disabled={clearing || messages.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10,
                background: messages.length === 0 ? '#18181b' : '#2d0f0f', border: '1px solid #7f1d1d',
                color: messages.length === 0 ? '#52525b' : '#f87171', cursor: 'pointer', fontSize: 12,
                opacity: clearing ? 0.5 : 1 }}>
              <RotateCcw size={12} /> 전체 초기화
            </button>
          </div>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3f3f46' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 14 }}>메시지가 없습니다</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(msg => (
              <MessageRow key={msg.id} msg={msg} onDelete={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function MessageRow({ msg, onDelete }: { msg: WallMessage; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const time = new Date(msg.sentAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  const del = async () => {
    setDeleting(true)
    // NOTE: individual delete not yet supported — uses optimistic UI
    onDelete()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
      background: '#18181b', border: '1px solid #27272a' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f4f4f5' }}>{msg.text}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#71717a' }}>{msg.displayName} · {time}</p>
      </div>
      <button onClick={del} disabled={deleting}
        style={{ padding: '6px 8px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer',
          color: '#52525b', opacity: deleting ? 0.4 : 1 }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
