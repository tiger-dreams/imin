# Agent QA - Daily Demo Check-In

Date: 2026-05-24
Scope: Daily sample event and event-detail check-in CTA
Local URL: http://127.0.0.1:3001/

## QA Intent

The app home should present the event platform demo as the primary path. The legacy single hackathon check-in entry should be hidden from home, while one sample event should always appear as a same-day demo event. Users should apply to that event and then start onsite check-in from the event detail page.

## Product / Platform Benchmarking

Not required. This is a product-flow adjustment requested by the user.

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Production build | `npm run build` | Pass |
| Diff whitespace | `git diff --check` | Pass |
| Playwright mobile demo flow | login, open daily sample event, apply, verify check-in CTA | Pass |

## Browser Assertions

| Assertion | Result |
| --- | --- |
| Home contains `오늘의 imin 데모 체크인` | Pass |
| Home no longer contains `기존 현장 체크인 열기` | Pass |
| Sample event detail includes today's date | Pass |
| Check-in CTA is disabled before participation confirmation | Pass |
| Auto-approved participation enables `현장 체크인 시작` | Pass |
| Console/page errors are empty | Pass |
| Mobile overflow list is empty | Pass |

## Screenshot Evidence

- `/private/tmp/imin-daily-demo-checkin.png`

## Issues Found

None from automated checks.

## Final Status

The demo flow is release-ready locally. The direct `/checkin` route remains available as a hidden legacy route.
