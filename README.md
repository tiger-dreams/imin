# imin

> **지금 여기 있는 사람만 인증한다**

Tech Week Hackathon Idea Competition KR 현장 인증 앱. LINE LIFF 기반으로 GeoIP + GPS로 참석을 검증하고, 실시간 접속자 대상 추첨까지 운영할 수 있다.

---

## 핵심 흐름

```
LINE 로그인 (LIFF)
        → 행사 홈
             ├─ 행사 만들기 / 모바일 초대장 생성
             ├─ 행사 상세 공유 / 참여 신청 및 참석 재확인
             └─ 기존 현장 체크인 플로우
                   → GeoIP + GPS 검증
                   → I'm in! 체크인
                   → 활성 세션 추첨
```

## 주요 기능

| 기능 | 설명 |
|---|---|
| 행사 생성 | 모바일 청첩장처럼 제목, 설명, 이미지, 일정, 장소, 정원, 승인 방식 설정 |
| 행사 홈/상세 | 공개 행사 목록, 내가 만든 행사, eventId 기반 초대장 상세 |
| 참여 신청 | 공개 행사 신청, 주최자 승인, 대기/거절 상태 관리 |
| 참석 재확인 (RSVP) | 참가 확정자 대상 참석/고민 중/불참, 동반 인원, 메시지 저장 |
| LINE 공유 | LIFF Share Target Picker 지원 환경에서는 친구/그룹으로 Flex 초대장 공유, 그 외 환경은 Web Share API/링크 복사 fallback |
| 온라인 입장 | 온라인/하이브리드 행사에서 참가 확정자 또는 주최자가 웨비나/그룹콜 링크로 입장하고 온라인 출석 기록 |
| 릴리즈 내역 | `/release` — 최근 GSD 작업, 검증 결과, 관련 이슈와 QA 로그 확인 |
| GeoIP 인증 | ipapi.co 기반 국가/도시 확인 |
| GPS 인증 | 브라우저 Geolocation API |
| Presence Score | 체크인 40pt + GeoIP 20pt + GPS 20pt |
| 활성 세션 추첨 | Upstash Redis로 실시간 접속자 추적, 폴링 기반 참여자 뷰 |
| 당첨 확인 (imin!) | 당첨 후 15초 이내 버튼 클릭 필수, 미응답 시 Reroll |
| Admin 대시보드 | `/admin` — 추첨 설정, 지역 필터, 결과 관리 (PC Web) |
| LINE OA Webhook | 친구 추가 시 웰컴 Flex Message 자동 발송 |

## 기술 스택

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4
- **Auth**: LINE LIFF SDK v2
- **Backend**: Vercel Serverless Functions (Node.js)
- **Storage**: Upstash Redis (HTTP REST API)
- **Deploy**: Vercel

## 프로젝트 구조

```
imin/
├── api/                    # Vercel Serverless Functions
│   ├── events.ts           # GET/POST /api/events — 행사 목록/상세/생성
│   │                       # action=participation — 신청/승인/참석 재확인/온라인 입장 조회/저장
│   ├── checkin.ts          # POST /api/checkin — 체크인 & Redis 등록
│   ├── active.ts           # GET  /api/active  — 실시간 접속자 목록
│   ├── heartbeat.ts        # POST /api/heartbeat — TTL 갱신
│   ├── raffle-state.ts     # GET/POST /api/raffle-state — 추첨 상태
│   ├── raffle-confirm.ts   # POST /api/raffle-confirm — 당첨 확인
│   └── webhook.ts          # POST /api/webhook — LINE OA Follow 이벤트
├── src/
│   ├── contexts/
│   │   └── LiffContext.tsx # LINE LIFF 초기화 & 프로필
│   └── pages/
│       ├── EventPlatformPage.tsx # 행사 홈/생성/상세/신청자 관리
│       ├── ReleaseNotesPage.tsx # 릴리즈 내역
│       ├── LoginPage.tsx   # LINE 로그인
│       ├── VerifyPage.tsx  # GeoIP + GPS 검증
│       ├── MainPage.tsx    # 기능 메뉴
│       ├── RafflePage.tsx  # 참여자 추첨 뷰 (폴링)
│       └── AdminPage.tsx   # 호스트 대시보드 (/admin)
└── vercel.json
```

## 로컬 개발

```bash
git clone https://github.com/tiger-dreams/imin.git
cd imin
npm install
cp .env.example .env
# .env에 값 채우기
npm run dev
```

localhost에서는 LIFF 없이 Dev mode로 자동 실행된다. Vite dev server만 사용할 때는 Vercel API가 없으므로 행사 생성/참여 신청/참석 재확인이 localStorage fallback으로 동작한다. 실제 배포/preview에서는 `/api/events`가 행사와 참여 신청 상태를 Upstash Redis에 저장한다.

### 환경변수

| 변수 | 설명 |
|---|---|
| `VITE_LIFF_ID` | LINE LIFF ID |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |
| `LINE_CHANNEL_SECRET` | LINE Messaging API 채널 시크릿 (webhook 서명 검증) |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE 채널 액세스 토큰 (메시지 발송) |

## 배포 (Vercel)

```bash
# GitHub 푸시 시 자동 배포
git push origin main
```

Vercel 대시보드 → Settings → Environment Variables에서 위 환경변수 설정 필요.

## GSD 운영 방식

이 프로젝트의 "GSD done"은 구현 완료가 아니라 QA, 코드 리뷰, 검증 기록까지 끝난 push-ready 상태를 뜻한다.

- 작업 규칙: `AGENTS.md`
- 릴리즈 게이트: `docs/release/README.md`
- QA 템플릿: `docs/release/agent_qa_template.md`
- 코드 리뷰 템플릿: `docs/release/agent_codereview_template.md`

push는 사용자가 명시적으로 요청할 때만 진행한다.

## Admin 사용법

`/admin` 경로로 접근 (LIFF 불필요, PC Web):

1. **추첨 설정** — 상품명, 당첨 인원(1/2/3/5명), 추첨 방식 선택
2. **지역 필터** — 현재 접속자의 도시별 필터링 (미선택 시 전체 대상)
3. **추첨 시작** → 참여자들의 앱에 대기 상태 표시
4. **지금 추첨!** → 2.5초 드라마틱 연출 후 결과 공개
5. **당첨 확인** — 15초 카운트다운, 미응답 시 슬롯별 Reroll 가능

### 추첨 방식

| 방식 | 설명 |
|---|---|
| 완전 랜덤 | 참여자 중 무작위 선택 |
| 점수 높은 분 | Presence Score 상위권 우선 풀 구성 후 랜덤 |
| 한 명씩 공개 | 드라마틱하게 한 명씩 발표 |
| 초성 퀴즈 | 정답 맞힌 사람만 추첨 풀 포함 |

## LINE OA 설정

**인사 메시지 (Greeting Message)**

[OA Manager](https://manager.line.biz) → 채팅 → 자동 응답 메시지 → 인사 메시지에서 LIFF URL 포함 텍스트 설정.

**Webhook (Follow 이벤트 자동 메시지)**

LINE Developers Console → Messaging API:
- Webhook URL: `https://{배포-도메인}/api/webhook`
- Use webhook: ON / Auto-reply: OFF

---

*Made at Tech Week Hackathon 2025*
