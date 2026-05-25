# Agent QA - Event Operations Controls

Date: 2026-05-25
Local URL: http://127.0.0.1:3000
Scope: Event creation validation, day-of check-in visibility, host/admin applicant management, overbooking controls, application window/limit controls, release notes, and PMM blog copy
Tooling: Playwright with local Vite server

## QA Intent

Hosts should be able to configure event operations before publishing: required event fields, application limit, application window, capacity, overbooking percentage, and applicant management. Guests should not see host-only applicant management. Field check-in should only appear on the event day. Public release surfaces should describe the change.

Regressions would include ordinary guests seeing applicant lists, future events showing field check-in, host workflows losing applicant controls, application controls not rendering, or GSD release surfaces missing the change.

## Product Or Platform Benchmarking

| Reference | Observed Pattern | Decision Applied |
| --- | --- | --- |
| Eventbrite waitlist help: https://www.eventbrite.com/help/en-us/articles/811539/ | Waitlists can trigger at capacity, have a maximum size, and include a time limit to claim/register. | imin separates application limit and confirmation limit, and adds application start/end controls. |
| Luma waitlist help: https://help.luma.com/p/waitlist | Event capacity controls approved guests and over-capacity demand goes to waitlist for host approval. | imin keeps host approval as the central operation and prevents public guests from seeing applicant management. |
| Luma registration process help: https://help.luma.com/p/event-registration-process | Hosts can require approval and set capacity/time limits from registration settings. | imin adds registration controls to the event creation flow instead of treating RSVP as a generic message form. |
| Cvent waitlisting release note: https://release.cvent.com/eventmanagement/board/waitlisting | Limited-capacity events can capture additional registrations and promote waitlisted attendees as space opens. | imin uses overbooking percentage plus waitlist status to account for no-shows without exposing the operator console to guests. |

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Diff whitespace | `git diff --check` | Pass |
| Production build | `npm run build` | Pass; Vite emitted only the existing bundle-size warning |
| Vercel function count | `find api -maxdepth 1 -type f -name '*.ts' \| wc -l` | Pass: 12 |
| JS syntax | `node --check <files>` | N/A; changed runtime files are TypeScript/TSX and covered by `tsc -b` |
| API smoke | Build plus code-level API review for `api/events.ts` | Pass; new checks are inside existing `api/events.ts`, no function-count increase |

## Browser Assertions

| Page / Flow | Assertion | Evidence | Result |
| --- | --- | --- | --- |
| `/events/new` | Create page shows `행사 내용`, `접수 한도`, `접수 시작`, and `접수 마감`. | Playwright DOM assertions returned true. | Pass |
| Future non-host event detail | Non-host guest does not see `신청자 관리`; future event does not show `현장 체크인`. | Playwright DOM assertions returned `nonHostHasApplicantPanel: false`, `nonHostHasCheckin: false`. | Pass |
| Host-owned event detail | Host sees applicant management, overbooking `130%`, confirmation limit `0/13명`, and application window metadata. | Playwright DOM assertions returned true. | Pass |
| `/release-notes` | Release notes include `행사 접수 운영과 호스트 권한 강화`. | Playwright DOM assertion returned true. | Pass |
| `/blog` | PMM article includes no-show/overbooking guidance. | Playwright DOM assertion returned true. | Pass |
| Console | No blocking browser console errors during checked flows. | `consoleErrors: []` | Pass |

## Screenshot Evidence

| Screenshot | Purpose | Result |
| --- | --- | --- |
| `/tmp/imin-gsd-2026-05-25/event-create-ops-controls.png` | Event creation controls: event content, application limit/window, overbooking. | Pass |
| `/tmp/imin-gsd-2026-05-25/non-host-event-detail.png` | Non-host detail page without applicant management and without future check-in. | Pass |
| `/tmp/imin-gsd-2026-05-25/host-applicant-management.png` | Host applicant management with capacity, overbooking, and application metadata. | Pass |

## Issues Found

### P2: API allowed host-only decisions to rely only on client-side controls

The UI hid applicant management from guests, but release readiness requires server-side checks for applicant-list reads and host/admin decisions. This was fixed by adding `requesterUserId` protection for full participation-list reads and `actorUserId` checks for participation status changes in `api/events.ts`.

## Final Status

- QA status: Pass
- Blocking issues: None
- Residual risk: Admin identity is environment-variable based (`VITE_IMIN_ADMIN_USER_IDS`, `IMIN_ADMIN_USER_IDS`). A durable role store and audit trail are still needed before production-scale operations.
