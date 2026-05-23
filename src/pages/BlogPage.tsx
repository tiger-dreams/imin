import { ArrowRight, CalendarDays, CheckCircle2, MessageCircle, Sparkles, Trophy, Users } from 'lucide-react'

const sections = [
  {
    title: 'imin이 필요한 순간',
    body: [
      'imin은 단순히 신청 폼을 하나 더 만드는 도구가 아닙니다. imin이 필요한 순간은 참석 의사와 실제 참여를 구분해야 할 때입니다.',
      '정원이 있는 밋업에서 신청자를 먼저 받고, 호스트가 확정자를 고르고 싶을 때. 행사 1주일 전쯤 노쇼를 줄이기 위해 RSVP를 재확인하고 싶을 때. 현장에 실제로 도착한 사람이나 웨비나에 라이브로 참여 중인 사람만 대상으로 래플을 하고 싶을 때, imin이 의미를 갖습니다.',
    ],
  },
  {
    title: '구글 폼, 캘린더, 채팅과 무엇이 다른가',
    body: [
      '구글 폼은 신청을 받는 데 좋고, 캘린더 RSVP는 참석 의사를 확인하는 데 좋고, 채팅은 행사 중 커뮤니케이션에 좋습니다. 하지만 이 세 가지는 서로 다른 상태를 관리합니다.',
      '폼의 신청자, 캘린더의 참석 예정자, 채팅방의 실제 참여자, 현장에 도착한 사람, 래플에 응답한 사람이 같은 사람인지 확인하려면 운영자가 직접 맞춰야 합니다.',
      'imin은 신청, 승인, RSVP 재확인, 체크인 또는 라이브 참여, 래플 eligibility, 사후 세그먼트를 하나의 verified participation timeline으로 연결합니다.',
    ],
  },
  {
    title: '작은 밋업에서는 이렇게 씁니다',
    body: [
      '공개 행사 페이지를 만들고 신청을 받습니다. 신청자는 바로 참석자가 되는 것이 아니라 신청자 목록에 들어갑니다.',
      '호스트는 신청자 목록을 보고 확정, 대기, 거절을 결정합니다. 이후 확정자에게 행사 며칠 전 RSVP 재확인을 요청합니다.',
      '행사 당일에는 실제 체크인한 사람만 참여자로 보고, 래플을 한다면 이 체크인된 사람만 대상으로 추첨합니다. 신청한 사람, 승인된 사람, 오겠다고 답한 사람, 실제 온 사람이 분리됩니다.',
    ],
  },
  {
    title: '사내 행사에서는 운영 데이터가 됩니다',
    body: [
      '올핸즈, 타운홀, 사내 웨비나, 워크숍, 해커톤, 데모데이 같은 행사에서는 참석 여부 자체가 운영 데이터가 됩니다.',
      '누가 실제로 참여했는지, 어떤 팀에서 관심이 많았는지, 행사 중 질문이나 반응이 있었는지, 다음 행사에는 누구에게 다시 안내하면 좋은지가 중요합니다.',
      'imin은 사내 행사에서도 실제 참여 중인 사람만 대상으로 래플을 진행하고, 참석자, 미참석자, 질문자, 래플 참여자, 당첨자 같은 그룹을 후속 커뮤니케이션에 쓸 수 있게 합니다.',
    ],
  },
  {
    title: '웨비나는 등록자가 아니라 라이브 참여자가 중요합니다',
    body: [
      '웨비나는 등록과 참여의 차이가 큽니다. 등록자는 많지만 실제 라이브 참여자는 적을 수 있고, 캘린더 RSVP는 참석 의사에 가깝습니다.',
      '오프라인 행사의 presence가 체크인, QR, GPS, 현장 heartbeat라면, 웨비나의 presence는 live join, heartbeat, poll, Q&A, comment, raffle interaction 같은 신호가 됩니다.',
      '그래서 래플도 등록한 사람 중 추첨이 아니라, 해당 시간에 실제로 참여 중인 사람 중 추첨이 됩니다.',
    ],
  },
  {
    title: '하이브리드 행사에는 하나의 기준이 필요합니다',
    body: [
      '오프라인과 온라인이 섞인 하이브리드 행사는 운영이 더 복잡합니다. 현장 참석자는 체크인으로 확인할 수 있지만, 온라인 참석자는 별도의 참여 신호가 필요합니다.',
      'imin은 현장 참여자는 체크인으로, 온라인 참여자는 라이브 접속과 상호작용으로 presence를 확인합니다. 래플이나 사후 세그먼트는 이 verified participation을 기준으로 실행합니다.',
    ],
  },
]

const useCases = [
  '정원 제한이 있는 밋업',
  '승인이 필요한 워크숍',
  '사내 올핸즈와 웨비나',
  '하이브리드 네트워킹',
  'presence 기반 공정한 래플',
  '행사 후 세그먼트 관리',
]

export default function BlogPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#fbf8f2', color: '#302820' }}>
      <header className="px-5 py-4 sticky top-0 z-10" style={{ background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #eadfcc' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 no-underline" style={{ color: '#302820' }}>
            <img src="/logo.png" alt="imin" className="h-8" />
            <span className="text-sm font-black">imin</span>
          </a>
          <nav className="flex items-center gap-3 text-sm font-bold">
            <a href="/release-notes" style={{ color: '#6f5c4a', textDecoration: 'none' }}>Release Notes</a>
            <a href="/" style={{ color: '#6f5c4a', textDecoration: 'none' }}>App</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        <article>
          <section className="py-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black" style={{ background: '#fffaf2', border: '1px solid #eadfcc', color: '#8d6e52' }}>
              <Sparkles size={13} /> Product Marketing
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mt-5">구글 폼과 캘린더 RSVP만으로 부족해지는 순간</h1>
            <p className="text-xl sm:text-2xl leading-9 mt-5 font-bold" style={{ color: '#6f5c4a' }}>
              신청부터 승인, 현장 참여, 공정한 래플, 사후 세그먼트까지 이어지는 작은 팀을 위한 행사 운영 방식
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6 text-sm font-bold" style={{ color: '#8d6e52' }}>
              <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> 2026.05.24</span>
              <span>how-teams-use-imin-for-verified-events</span>
            </div>
          </section>

          <section className="rounded-3xl p-5 sm:p-7" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
            <p className="text-lg leading-9" style={{ color: '#4d4034' }}>
              작은 행사를 준비할 때 가장 먼저 떠오르는 도구는 보통 구글 폼, 구글 캘린더, 그리고 채팅방입니다. 이 조합은 단순한 모임에는 충분합니다. imin이 모든 행사를 대체해야 하는 것도 아닙니다.
            </p>
            <p className="text-lg leading-9 mt-4" style={{ color: '#4d4034' }}>
              하지만 행사가 조금만 운영형으로 바뀌면 문제가 생깁니다. 누가 신청했고, 누가 승인되었고, 누가 실제로 왔고, 누가 라이브로 참여했고, 누가 질문했고, 누가 래플 대상인지가 서로 다른 도구에 흩어집니다. 이때 호스트는 행사를 운영하는 사람이 아니라 스프레드시트를 맞추는 사람이 됩니다.
            </p>
          </section>

          <section className="grid sm:grid-cols-3 gap-3 mt-5">
            <BlogMetric icon={<Users size={18} />} value="신청→승인" label="참석 의사와 확정을 분리" />
            <BlogMetric icon={<MessageCircle size={18} />} value="Presence" label="체크인과 라이브 참여 확인" />
            <BlogMetric icon={<Trophy size={18} />} value="Fair raffle" label="실제 참여자만 추첨" />
          </section>

          <section className="mt-10 space-y-9">
            {sections.map(section => (
              <div key={section.title}>
                <h2 className="text-2xl sm:text-3xl font-black">{section.title}</h2>
                <div className="mt-3 space-y-4">
                  {section.body.map(paragraph => (
                    <p key={paragraph} className="text-base sm:text-lg leading-8" style={{ color: '#4d4034' }}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-3xl p-5 sm:p-7 mt-10" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
            <h2 className="text-2xl font-black">imin을 쓰기 좋은 행사</h2>
            <ul className="grid sm:grid-cols-2 gap-3 p-0 mt-5 list-none">
              {useCases.map(useCase => (
                <li key={useCase} className="flex gap-2 text-sm font-bold" style={{ color: '#4d4034' }}>
                  <CheckCircle2 size={16} style={{ color: '#16803a', flexShrink: 0 }} />
                  {useCase}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl p-5 sm:p-7 mt-8" style={{ background: '#302820', color: '#fffaf2' }}>
            <h2 className="text-2xl sm:text-3xl font-black">핵심은 기능 목록이 아니라 운영 흐름입니다</h2>
            <p className="text-base sm:text-lg leading-8 mt-4" style={{ color: '#e9dccb' }}>
              신청합니다. 호스트가 승인하거나 대기자로 둡니다. 확정자에게 RSVP를 재확인합니다. 행사 당일 체크인하거나 라이브 참여를 확인합니다. presence가 확인된 사람을 대상으로 래플을 진행합니다. 행사 후 참여 데이터를 기준으로 후속 액션을 만듭니다.
            </p>
            <p className="text-base sm:text-lg leading-8 mt-4" style={{ color: '#e9dccb' }}>
              행사는 한 번 열고 끝나는 일이 아닙니다. 좋은 행사는 다음 행사로 이어지는 데이터를 남깁니다. imin은 그 데이터를 호스트가 다룰 수 있는 형태로 만드는 도구입니다.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href="/" className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black no-underline" style={{ background: '#fffaf2', color: '#302820' }}>
                imin 열기 <ArrowRight size={16} />
              </a>
              <a href="/release-notes" className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black no-underline" style={{ background: 'rgba(255,250,242,0.08)', color: '#fffaf2', border: '1px solid rgba(255,250,242,0.24)' }}>
                릴리즈 노트 보기
              </a>
            </div>
          </section>
        </article>
      </main>
    </div>
  )
}

function BlogMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-3xl p-4" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
      <div style={{ color: '#9b7654' }}>{icon}</div>
      <p className="text-xl font-black mt-3">{value}</p>
      <p className="text-xs font-bold mt-1" style={{ color: '#8d7a67' }}>{label}</p>
    </div>
  )
}
