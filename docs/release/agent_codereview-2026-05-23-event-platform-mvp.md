# Agent Code Review - Event Platform MVP

Date: 2026-05-23
Scope: Event creation API, RSVP API, mobile event platform UI, profile settings, routing, and README/GSD docs

## Review Method

- Reviewed the current diff from a PR review perspective.
- Focused on bugs, regressions, missing tests, security, privacy, reliability, and release risks.
- A separate review agent was not spawned because higher-priority tool policy only allows sub-agents when the user explicitly asks for sub-agents/delegation/parallel agent work.
- Ran local verification:
  - `git diff --check`
  - `npm run build`
  - `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck --types node api/events.ts api/event-rsvp.ts`
  - Playwright mobile flow over `http://127.0.0.1:3000/`

## Findings

### P1: Legacy check-in route could not be reached from the event home

The event home initially used the internal event router for `/checkin`, but `EventPlatformPage` only resolves `/`, `/events/new`, and `/events/:id`. This meant tapping "기존 현장 체크인 열기" could update the URL without remounting the app's top-level route.

Resolution:

- Made the top-level app route reactive to `popstate`.
- Changed the button to push `/checkin` into browser history and dispatch `popstate`, so the app switches routes without losing the current LIFF/dev login context.

### P2: Local Vite QA produced `/api/*` console errors before fallback

The UI correctly fell back to localStorage when Vite returned 404 for Vercel functions, but the failed requests still surfaced as console errors.

Resolution:

- Added a localhost Vite local-store mode for event list/detail/create/RSVP calls so local QA does not hit missing Vercel API routes.

## No Blocking Findings

No remaining P0/P1/P2 blocking findings found after the fixes above.

Areas checked:

- Event data model and Redis key structure
- Event create/list/detail API behavior
- RSVP create/read API behavior
- Mobile event home, creation, invitation, and RSVP UI
- Header logo/profile entry and local profile settings
- Legacy route preservation for `/checkin`
- Local fallback behavior for Vite dev server

## Verification

Latest local result:

```text
git diff --check
Pass

npm run build
Pass. Vite build completed; non-blocking warnings for eruda eval and chunk size.

npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck --types node api/events.ts api/event-rsvp.ts
Pass

Playwright mobile flow
home=true, create=true, rsvp=true, errors=[]

Playwright legacy check-in route
urlReached=true, stayedLoggedIn=true, errors=[]

Playwright profile settings flow
hasLogo=true, hasProfile=true, saved=true, errors=[]
```

Residual risk:

- Real Vercel/Upstash API smoke is still needed on a preview deployment.
- Server endpoints trust client-provided LIFF user identity, consistent with existing code but not sufficient for strong host-only authorization.
