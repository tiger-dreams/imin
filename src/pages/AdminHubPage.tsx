import { Trophy, MessageSquare, ExternalLink } from 'lucide-react'

export default function AdminHubPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>

      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="imin" style={{ height: 36, filter: 'brightness(0) invert(1)', margin: '0 auto' }} />
          <p style={{ fontSize: 13, color: '#52525b', marginTop: 10 }}>Admin</p>
        </div>

        {/* QR Code */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 20px 14px', marginBottom: 28, textAlign: 'center', maxWidth: 280, margin: '0 auto 28px' }}>
          <img src="/line_qr.png" alt="LINE QR" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
          <p style={{ fontSize: 13, color: '#3f3f46', fontWeight: 600, marginTop: 10, marginBottom: 0 }}>LINE으로 참여하기</p>
          <p style={{ fontSize: 11, color: '#71717a', marginTop: 4, marginBottom: 0 }}>QR을 스캔하면 바로 입장</p>
        </div>

        {/* Nav cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <NavCard
            href="/admin/raffle"
            icon={<Trophy size={22} style={{ color: '#facc15' }} />}
            title="경품 추첨"
            desc="참여자 관리 · 추첨 진행 · 당첨자 발표"
            accent="#713f12"
            accentLight="#facc15"
          />
          <NavCard
            href="/admin/wall"
            icon={<MessageSquare size={22} style={{ color: '#818cf8' }} />}
            title="메시지 월 관리"
            desc="참여자 메시지 확인 · 삭제 · 초기화"
            accent="#312e81"
            accentLight="#818cf8"
          />
        </div>

        {/* Wall preview link */}
        <a href="/wall" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24,
            fontSize: 12, color: '#52525b', textDecoration: 'none' }}>
          <ExternalLink size={12} />
          /wall 공개 화면 열기
        </a>
      </div>
    </div>
  )
}

function NavCard({ href, icon, title, desc, accent, accentLight }: {
  href: string; icon: React.ReactNode; title: string; desc: string; accent: string; accentLight: string
}) {
  return (
    <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', borderRadius: 16,
      background: '#18181b', border: `1px solid ${accent}`, textDecoration: 'none', color: 'inherit',
      transition: 'opacity 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: accentLight }}>{title}</p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#71717a' }}>{desc}</p>
      </div>
      <span style={{ fontSize: 18, color: '#3f3f46' }}>→</span>
    </a>
  )
}
