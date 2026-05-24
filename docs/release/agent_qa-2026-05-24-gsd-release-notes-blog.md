# Agent QA - GSD Release Notes And Blog

Date: 2026-05-24
Local URL: http://127.0.0.1:3000/
Scope: Public release notes page, public blog article, GSD documentation updates, product/architecture planning docs
Tooling: Playwright from temporary QA workspace `/tmp/imin-playwright-qa`

## QA Intent

Users should be able to see what changed in imin through a public web release notes page. Product-facing capabilities should also be explainable through a PMM-style blog article at `/blog`. GSD instructions should require these surfaces for future user-facing releases.

## Product Context

This work responds to the product need that a non-engineer hackathon team can keep building imin with AI while preserving release discipline. The public pages should help users understand added functionality, while the docs should help future AI-led changes stay stable.

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Diff whitespace | `git diff --check` | Pass |
| Production build | `npm run build` | Pass |
| Vercel function count | `find api -maxdepth 1 -type f -name '*.ts' \| wc -l` | Pass: 12 functions |

## Browser Assertions

| Page / Flow | Assertion | Evidence | Result |
| --- | --- | --- | --- |
| `/release-notes` | Opens without LINE login and shows latest release notes. | `/tmp/imin-playwright-qa/release-notes-page.png`; `releaseLoginGate=0`, `errors=[]` | Pass |
| `/blog` | Opens without LINE login and shows PMM article about using imin beyond Forms/Calendar/chat. | `/tmp/imin-playwright-qa/blog-page.png`; `blogLoginGate=0`, `errors=[]` | Pass |
| `/` sample event card | Shows the approval-based technical meetup sample inspired by a Luma event structure. | `/tmp/imin-playwright-qa/sample-fde-event-card.png`; `errors=[]` | Pass |
| `/events/sample-fde-night-seoul` | Opens sample detail and shows manual participation application CTA. | `/tmp/imin-playwright-qa/sample-fde-event-detail.png`; `errors=[]` | Pass |

## Release Notes

- Added `/release-notes` as a public web page for user-facing GSD changes.
- Added `/blog` as a public product marketing article explaining when and how to use imin.
- Updated GSD instructions to require release notes updates for user-facing work.
- Updated GSD instructions to use a Product Marketing Manager lens for meaningful product-facing capabilities.
- Added product and architecture documents for AI-led development stability.
- Added a realistic approval-based technical meetup sample event modeled after a public Luma event pattern.

## Issues Found

No blocking issues found.

## Residual Risk

- `/release-notes` currently uses static in-app content. Future releases need a disciplined update step until a CMS or markdown pipeline exists.
- `/blog` currently contains one static article. If multiple articles are needed, routing and content structure should be split before adding more.
