# Agent QA - <version or release name>

Date: <YYYY-MM-DD>
Local URL: <http://127.0.0.1:PORT/path>
Scope: <short description of the QA scope>
Tooling: <Playwright / Codex in-app browser / fallback>

## QA Intent

Describe what users, admins, or event operators should be able to do after this release and what would count as a regression.

## Product Or Platform Benchmarking

Required when the release changes UX judgment, interaction behavior, visual affordances, navigation/information architecture, event operations, or another ambiguous product decision. Skip and write `Not required` for narrow bug fixes, copy edits, dependency chores, or user-specified designs.

| Reference | Observed Pattern | Decision Applied |
| --- | --- | --- |
| <product/doc/link> | <behavior relevant to this release> | <how this shaped the implementation> |

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Diff whitespace | `git diff --check` | <pass/fail> |
| Production build | `npm run build` | <pass/fail> |
| Vercel function count | `find api -maxdepth 1 -type f -name '*.ts' \| wc -l` | <pass/fail; must be <=12 on Hobby> |
| JS syntax | `node --check <files>` | <pass/fail or n/a> |
| API smoke | `<command or browser flow>` | <pass/fail or n/a> |

## Browser Assertions

Use Playwright when available and practical. If Playwright is not available, use the Codex in-app browser and document the fallback.

| Page / Flow | Assertion | Evidence | Result |
| --- | --- | --- | --- |
| <page or flow> | <DOM state, console state, visible UI, interaction result> | <screenshot path / command output / DOM query> | <pass/fail> |

Required assertion types when applicable:

- Page opens on the local server with no blocking console errors.
- Changed visual surfaces are captured as screenshots.
- Changed links, buttons, forms, filters, or controls are verified through DOM queries or browser interactions.
- LIFF login, dev-mode fallback, or logged-out states are checked when auth surfaces change.
- GeoIP/GPS behavior and permission-denied behavior are checked when verification changes.
- Admin raffle flows exercise setup, active participant visibility, draw, confirmation, reroll, and history when relevant.
- Event wall flows exercise display and admin moderation when relevant.
- Changed serverless functions include API-level assertions or documented smoke checks.

## Screenshot Evidence

| Screenshot | Purpose | Result |
| --- | --- | --- |
| `<path>` | <what this screenshot proves> | <pass/fail> |

## Issues Found

### <severity>: <issue title>

<Describe issue, fix, or accepted risk.>

## Final Status

- QA status: <pass/fail>
- Blocking issues: <none/list>
- Residual risk: <known limitation, if any>
