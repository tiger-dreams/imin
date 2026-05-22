# Agent QA - Event Platform MVP

Date: 2026-05-23
Local URL: http://127.0.0.1:3000/
Scope: Event creation, mobile invitation detail, sharing, participation application/approval, RSVP reconfirmation, profile settings, and legacy check-in route preservation
Tooling: Playwright from temporary QA workspace `/tmp/imin-playwright-qa`

## QA Intent

Hosts should be able to create a mobile invitation-style event page, share a stable event URL, review participation applications, and confirm/waitlist/reject applicants. Guests should be able to open the event detail, read schedule/location/gift notes, apply first, and only submit RSVP reconfirmation after they are confirmed. The existing single-event check-in flow should remain reachable at `/checkin`.

## Product Or Platform Benchmarking

| Reference | Observed Pattern | Decision Applied |
| --- | --- | --- |
| https://vibevite.com/ | Event page, single share link, RSVP tracking, and media-oriented memories are positioned as one flow. | Keep one event detail URL as the guest-facing artifact and keep participation/RSVP state on the same page. |
| https://www.gatherwith.us/ | Mobile-first invitation page with built-in RSVP tracking and link sharing. | Use a phone-first invitation layout rather than an admin-heavy event form as the primary artifact. |
| https://marrly.com/en | Wedding invitation pages include schedule, venue map context, gift envelope, and instant edits. | Include schedule, venue/address, gift note, and contact note fields in the MVP. |
| https://www.zola.com/wedding-planning/website | Wedding websites commonly combine photos, event details, registry/gift information, privacy, and online RSVP. | Add public/link-only visibility, gift note, cover image URL, and keep RSVP as a later reconfirmation step for confirmed participants. |
| GitHub issue #7 comment | Product direction clarified that public events need application first, host approval second, and RSVP as a 7-10 day reconfirmation/waitlist operations tool. | Implemented `action=participation` inside `api/events.ts` instead of adding a new API function, preserving the 12-function Hobby limit. Comment: https://github.com/tiger-dreams/imin/issues/7#issuecomment-4520183081 |

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Diff whitespace | `git diff --check` | Pass |
| Production build | `npm run build` | Pass. Vite warned about `eruda` eval and chunk size, both existing/non-blocking build warnings. |
| API TypeScript | `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck --types node api/events.ts` | Pass |
| Vercel function count | `find api -maxdepth 1 -type f -name '*.ts' | wc -l` | Pass: 12 functions, within Hobby plan limit |
| API smoke | Local Vite uses localStorage fallback; deployed API smoke remains pending until Vercel preview has Redis env. | Not run locally |

## Browser Assertions

| Page / Flow | Assertion | Evidence | Result |
| --- | --- | --- | --- |
| `/` login and event home | Dev login reaches event home with create CTA and no console errors. | `/tmp/imin-playwright-qa/event-home.png`; Playwright `errors: []` | Pass |
| `/events/new` | Event creation form accepts wedding title, co-host, invitation text, datetime, venue, address, capacity, and dress note. | `/tmp/imin-playwright-qa/event-create.png` | Pass |
| `/events/:eventId` | Created event opens as a mobile invitation detail page with title, hosts, date, venue, notes, participation application, and share link. | `/tmp/imin-playwright-qa/event-detail.png` | Pass |
| Participation application | Guest flow starts with `참여 신청`, not direct RSVP. Manual approval creates an `승인 대기` state. | Event detail UI and local participation state | Pass |
| Host applicant management | Host sees `신청자 관리` and can move applicants to confirmed, waitlisted, or rejected without adding a new serverless function. | `/tmp/imin-playwright-qa/event-participation-host.png`; Playwright `guestStatus=confirmed`, `errors=[]` | Pass |
| RSVP reconfirmation | RSVP controls are only shown for `참가 확정` participants. | `/tmp/imin-playwright-qa/event-reconfirmation.png`; Playwright `myRsvp=maybe`, `errors=[]` | Pass |
| Profile management | Header uses the `imin` logo asset, profile avatar opens profile settings, and real name/email/phone/company save locally. | `/tmp/imin-playwright-qa/profile-sheet.png`; Playwright `saved=true`, `errors=[]` | Pass |
| Legacy check-in route | "기존 현장 체크인 열기" switches to `/checkin` without losing dev login state. | Playwright result `urlReached=true`, `stayedLoggedIn=true`, `errors=[]` | Pass |
| Console state | Home-create-detail-RSVP flow produced no console errors after local API fallback adjustment. | Playwright result `errors: []` | Pass |

## Screenshot Evidence

| Screenshot | Purpose | Result |
| --- | --- | --- |
| `/tmp/imin-playwright-qa/event-home.png` | Event home and mobile-first entry point | Pass |
| `/tmp/imin-playwright-qa/event-create.png` | Event creation form visual QA | Pass |
| `/tmp/imin-playwright-qa/event-detail.png` | Invitation detail visual QA | Pass |
| `/tmp/imin-playwright-qa/event-rsvp.png` | RSVP saved state visual QA from previous RSVP-first flow | Superseded by participation-flow QA |
| `/tmp/imin-playwright-qa/event-participation-host.png` | Host applicant management visual QA | Pass |
| `/tmp/imin-playwright-qa/event-reconfirmation.png` | Confirmed participant RSVP reconfirmation visual QA | Pass |
| `/tmp/imin-playwright-qa/profile-sheet.png` | Profile settings visual QA | Pass |

## Issues Found

### P1: Legacy check-in button used internal event router

The home button for the legacy `/checkin` flow initially used the event page's internal `navigate` helper. Because the top-level app route is computed outside that helper, it could leave the user on the event home instead of entering the check-in flow.

Resolution:

- Made the top-level app route reactive to `popstate`.
- Changed the button to push `/checkin` into browser history and dispatch `popstate`, preserving the current LIFF/dev login context.

### P1: Vercel Hobby deployment exceeded serverless function limit

The first pushed deployment added both `api/events.ts` and `api/event-rsvp.ts`, bringing the project to 13 serverless functions. Vercel Hobby allows no more than 12 functions per deployment.

Resolution:

- Merged RSVP read/write handling into `api/events.ts` with `action=rsvp`.
- Removed `api/event-rsvp.ts`, bringing the deployment back to 12 functions.

### P1: Public events incorrectly treated RSVP as the first guest action

The initial MVP let guests submit an RSVP immediately. For public events, this prevented hosts from reviewing applicants before confirming attendance and made waitlist operations unclear.

Resolution:

- Replaced RSVP-first guest flow with participation application.
- Added host applicant management for confirmed/waitlisted/rejected states.
- Kept RSVP as a reconfirmation step only for confirmed participants.
- Stored participation data through `api/events.ts` with `action=participation`, keeping the API count at 12.

## Final Status

- QA status: Pass for local mobile MVP flow, including participation application, host approval, and confirmed-participant RSVP reconfirmation
- Blocking issues: None after legacy route fix
- Residual risk: Vercel deployed API smoke with real Upstash Redis env remains to be verified in preview/production. RSVP storage currently trusts client-provided LIFF user identity, matching existing app patterns but not a hardened authorization model.
