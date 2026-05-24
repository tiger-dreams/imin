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
    title: 'GSD 릴리즈 노트와 블로그 운영',
    summary: 'AI로 개발하는 팀이 안정적으로 확장할 수 있도록 제품/아키텍처/GSD 문서를 정리하고, 기능 변화를 웹에서 확인할 수 있는 공개 릴리즈 노트와 PMM 관점의 활용 아티클을 추가했습니다.',
    highlights: [
      '상위 제품 기획 문서와 AI 개발 아키텍처 문서 추가',
      '사용자 관리자 프로세스 PlantUML과 이벤터스 벤치마킹 리포트 정리',
      '/release-notes 별칭 라우트 추가',
      '/blog 공개 활용 아티클 추가',
      'GSD 지침에 릴리즈 노트와 PMM 블로그 업데이트 기준 추가',
      '승인형 기술 밋업 샘플 행사 추가',
    ],
    checks: ['npm run build', 'git diff --check', 'Playwright /release-notes·/blog QA', 'API 함수 수 12개 유지'],
    links: [
      { label: '블로그', href: '/blog' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-gsd-release-notes-blog.md' },
    ],
  },
  {
    date: '2026-05-24',
    title: '행사형 체크인 UX 통합',
    summary: '레거시 체크인 화면을 행사 플랫폼 테마와 실제 사용자 흐름에 맞춰 재정리했습니다.',
    highlights: [
      '행사 상세에서 체크인 진입 시 행사명, 장소, 복귀 경로 저장',
      'GeoIP/GPS 인증 화면을 초대장 기반의 밝은 테마로 변경',
      '체크인 완료 메뉴를 행사 플랫폼 톤으로 변경',
      '체크인 완료 후 행사 상세로 돌아가기 CTA 제공',
    ],
    checks: ['npm run build', 'git diff --check', 'Playwright 모바일 체크인 QA', 'API 함수 수 12개 유지'],
    links: [
      { label: 'Issue #14', href: 'https://github.com/tiger-dreams/imin/issues/14' },
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-checkin-ux-integration.md' },
    ],
  },
  {
    date: '2026-05-24',
    title: '오늘 데모 행사 체크인 흐름',
    summary: '홈의 레거시 단일 체크인 링크를 숨기고, 매일 오늘 날짜로 갱신되는 샘플 행사 상세에서 체크인을 시작하도록 데모 흐름을 정리했습니다.',
    highlights: [
      '샘플 행사 `오늘의 imin 데모 체크인` 날짜를 매일 오늘 13:00-18:00으로 자동 갱신',
      '홈 화면의 `기존 현장 체크인 열기` 링크 제거',
      '오프라인/하이브리드 행사 상세에 `현장 체크인` CTA 추가',
      '참여 확정 전에는 체크인 CTA 비활성화, 자동 승인 후 활성화',
    ],
    checks: ['npm run build', 'git diff --check', 'Playwright 모바일 데모 체크인 QA'],
    links: [
      { label: 'QA 로그', href: 'https://github.com/tiger-dreams/imin/blob/main/docs/release/agent_qa-2026-05-24-daily-demo-checkin.md' },
    ],
  },
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
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black" style={{ color: '#9b7654' }}>imin</p>
          <h1 className="text-lg font-black leading-tight">릴리즈 내역</h1>
        </div>
        <a href="/blog" className="rounded-full px-3 py-2 text-xs font-black" style={{ background: '#302820', color: '#fffaf2', textDecoration: 'none' }}>
          Blog
        </a>
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
