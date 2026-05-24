# Agent QA - Release Notes Page

Date: 2026-05-24
Scope: Public release history page and home link
Local URL: http://127.0.0.1:3001/release

## QA Intent

Users and operators should be able to open a stable release history URL, review recent GSD work, and jump to related GitHub issues and QA logs. The event home should expose a visible link to the release page.

## Product / Platform Benchmarking

Not required. This is a narrow documentation/navigation surface using existing app styling and locally recorded release logs.

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Production build | `npm run build` | Pass |
| Diff whitespace | `git diff --check` | Pass |
| Vercel function count | `find api -maxdepth 1 -type f -name '*.ts' \| wc -l` | Pass: 12 |
| Home route response | `curl -I http://127.0.0.1:3001/` | Pass: 200 |
| Release route response | `curl -I http://127.0.0.1:3001/release` | Pass: 200 |

## Browser QA

Browser screenshot automation was not available through the current Computer Use session. Route serving and production build were verified. Visual follow-up should confirm:

- `/release` renders as a public page without LIFF login.
- The back button returns to `/`.
- Event home shows the `릴리즈 내역` link.
- GitHub issue and QA log links open in a new tab.

## Issues Found

None from available checks.

## Final Status

Build and route checks pass. Visual browser validation remains a follow-up item if this page is promoted as a release surface.
