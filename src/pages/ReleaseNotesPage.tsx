import { ArrowLeft, CheckCircle, ExternalLink, GitBranch, ShieldCheck, Sparkles } from 'lucide-react'

interface ReleaseNote {
  date: string
  title: string
  summary: string
  highlights: string[]
  checks: string[]
  links: Array<{ label: string; href: string }>
}

const RELEASES: ReleaseNote[] = [
  {
    date: '2026-05-24',
    title: '추첨 히스토리 관리 강화',
    summary: '운영자가 과거 추첨 결과를 더 쉽게 보관, 재사용, 정리할 수 있도록 히스토리 관리 도구를 확장했습니다.',
    highlights: [
      '추첨 기록 CSV 내보내기',
      '추첨 기록 전체 초기화',
      '과거 추첨의 상품/방식/인원/지역 설정 다시 불러오기',
      '기록 상세에 풀 인원, 확인율, 지역 필터 요약 표시',
    ],
    checks: ['npm run build', 'git diff --check', 'Playwright Admin 히스토리 QA', 'API 함수 수 12개 유지'],
    links: [
      { label: 'Issue #2', href: 'https://github.com/tiger-dreams/imin/issues/2' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-raffle-history-management.md' },
    ],
  },
  {
    date: '2026-05-24',
    title: '릴리즈 내역 페이지',
    summary: '앱 안에서 최근 GSD 작업, 검증 결과, 관련 이슈와 QA 로그를 확인할 수 있는 공개 페이지를 추가했습니다.',
    highlights: [
      '/release 공개 라우트 추가',
      '행사 홈 하단에 릴리즈 내역 링크 추가',
      '릴리즈별 구현 요약, 검증 항목, 이슈/QA 로그 링크 제공',
    ],
    checks: ['npm run build', 'git diff --check', 'API 함수 수 12개 유지', '/release 라우트 200 응답 확인'],
    links: [
      { label: '릴리즈 페이지', href: '/release' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-release-notes-page.md' },
    ],
  },
  {
    date: '2026-05-24',
    title: 'LINE 공유와 온라인 입장',
    summary: '행사 초대장을 LINE 친구/그룹으로 공유하고, 온라인 행사 참가 확정자가 웨비나 링크로 입장할 수 있게 했습니다.',
    highlights: [
      'LIFF Share Target Picker 우선 사용, Web Share API/링크 복사 fallback',
      '온라인/하이브리드 행사 입장 상태 표시',
      '참가 확정자 온라인 입장 시 onlineEnteredAt 기록',
    ],
    checks: ['npm run build', 'git diff --check', 'API 함수 수 12개 유지', '로컬 라우트 200 응답 확인'],
    links: [
      { label: 'Issue #10', href: 'https://github.com/tiger-dreams/imin/issues/10' },
      { label: 'Issue #9', href: 'https://github.com/tiger-dreams/imin/issues/9' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-line-share-online-entry.md' },
    ],
  },
  {
    date: '2026-05-23',
    title: '행사 플랫폼 MVP',
    summary: '단일 현장 체크인 앱에서 행사 생성, 모바일 초대장, 참여 신청, 주최자 승인, RSVP 재확인 흐름을 갖춘 행사 플랫폼으로 확장했습니다.',
    highlights: [
      '행사 홈, 행사 만들기, eventId 기반 상세 페이지',
      '참여 신청, 참가 확정/대기/거절 상태 관리',
      '참가 확정자 대상 RSVP 재확인',
      '기존 현장 체크인 플로우 /checkin 보존',
    ],
    checks: ['npm run build', 'Playwright 모바일 플로우 QA', 'API 함수 수 12개 유지', '코드 리뷰 로그 작성'],
    links: [
      { label: 'Issue #13', href: 'https://github.com/tiger-dreams/imin/issues/13' },
      { label: 'Issue #8', href: 'https://github.com/tiger-dreams/imin/issues/8' },
      { label: 'Issue #7', href: 'https://github.com/tiger-dreams/imin/issues/7' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-23-event-platform-mvp.md' },
    ],
  },
]

export default function ReleaseNotesPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#faf7f1', color: '#302820' }}>
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(250,247,241,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eadfcc' }}>
        <button
          onClick={() => {
            window.history.pushState({}, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}
          aria-label="홈으로"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-black" style={{ color: '#9b7654' }}>imin</p>
          <h1 className="text-lg font-black leading-tight">릴리즈 내역</h1>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4 max-w-3xl mx-auto">
        <section className="rounded-[28px] p-5" style={{ background: '#302820', color: '#fffaf2' }}>
          <div className="flex items-center gap-2 text-sm font-bold opacity-90">
            <Sparkles size={16} />
            <span>제품 변경 기록</span>
          </div>
          <h2 className="text-3xl font-black leading-tight mt-4">무엇이 바뀌었는지<br />한 곳에서 확인합니다</h2>
          <p className="text-sm leading-6 mt-4 opacity-80">GSD 작업 단위로 사용자 기능, 검증 결과, 관련 이슈와 QA 로그를 정리합니다.</p>
        </section>

        {RELEASES.map(release => (
          <article key={`${release.date}-${release.title}`} className="rounded-[28px] p-5 space-y-4" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black" style={{ color: '#9b7654' }}>{release.date}</p>
                <h2 className="text-2xl font-black mt-1">{release.title}</h2>
              </div>
              <div className="rounded-2xl px-3 py-2 text-xs font-black flex items-center gap-1.5" style={{ background: '#e8f7ec', color: '#16803a' }}>
                <ShieldCheck size={13} /> GSD
              </div>
            </div>

            <p className="text-sm leading-6" style={{ color: '#6f5c4a' }}>{release.summary}</p>

            <div className="space-y-2">
              {release.highlights.map(item => (
                <div key={item} className="flex gap-2 text-sm leading-6" style={{ color: '#4d4034' }}>
                  <CheckCircle size={15} className="shrink-0 mt-1" style={{ color: '#16803a' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#fbf8f2', border: '1px solid #eadfcc' }}>
              <p className="text-xs font-black mb-2 flex items-center gap-1.5" style={{ color: '#9b7654' }}><GitBranch size={13} /> 검증</p>
              <div className="flex flex-wrap gap-2">
                {release.checks.map(check => (
                  <span key={check} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#f4eadc', color: '#6f5c4a' }}>{check}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {release.links.map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-2 text-xs font-black inline-flex items-center gap-1.5" style={{ background: '#302820', color: '#fffaf2' }}>
                  {link.label}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}
