# AGENTS.md

This file provides guidance to Codex when working in this repository.

## Project Overview

`imin` is a LINE LIFF event check-in and live raffle app for Tech Week Hackathon-style onsite events. It verifies attendance with LINE login, GeoIP, browser GPS, and realtime presence, then supports admin-run raffles and event wall messaging.

## Development Commands

### Local Setup

- Install dependencies with `npm install`.
- Copy `.env.example` to `.env` and fill the required values when testing integrations.
- Run the Vite dev server with `npm run dev`.
- Localhost runs in development mode without requiring a live LIFF session where the app code supports it.

### Verification

- Primary local verification: `npm run build`.
- Use a local browser against `http://127.0.0.1:3000` or the Vite-provided port for UI QA.
- For API or integration changes, exercise the affected Vercel function directly where feasible.
- Do not commit real secrets, tokens, LIFF IDs, LINE channel credentials, or Upstash credentials. Keep only placeholder values in tracked files.

### Deployment

- Deployment target is Vercel.
- Push to the connected GitHub branch may trigger Vercel deployment, depending on project settings.
- Do not push unless the user explicitly asks for push.
- Vercel Hobby plan allows no more than 12 serverless functions per deployment. This repository must keep `api/*.ts` at 12 files or fewer unless the project moves to a Pro team. Before adding a new API file, prefer merging related handlers into an existing function and route by query/body action.
- Vercel environment variables must be configured in the Vercel dashboard for deployed behavior:
  - `VITE_LIFF_ID`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `LINE_CHANNEL_SECRET`
  - `LINE_CHANNEL_ACCESS_TOKEN`

## Operational Guardrails

- After every remote sync, pull, or fetch that changes repository instructions, read `AGENTS.md` before making release, commit, or push decisions.
- Never infer push permission from "GSD", "done", "fix", release-readiness language, or issue completion. Push only after the user explicitly says to push.
- If a push happens without explicit approval, stop and disclose it immediately. Do not create a corrective push or revert push without explicit user approval.
- For GSD work, keep the final state push-ready when practical: changes implemented, release gate recorded, local verification passed, and local commits created only when the user asks for commit or release-ready commit behavior.
- When repository release-gate instructions conflict with higher-priority tool policy, follow the higher-priority policy and record the unmet repository requirement plus the reason in the QA or review log.

## Required GSD Release Gate

In this repository, "GSD done" means release-ready, not merely implementation-complete.

When the user asks to complete work "GSD", "done까지", or equivalent, finish the release gate and leave the repository in a push-ready state unless the user explicitly asks to stop earlier. Do not push unless the user explicitly asks for push.

Before declaring GSD done for a release, production fix, or push:

1. Confirm scope and version posture.
   - This app currently has no lockfile and uses `package.json` versioning only.
   - If a versioned release is requested, update `package.json` and visible documentation that mention the current behavior.
   - Check `README.md` and any user-facing docs for stale feature descriptions, admin paths, environment variables, or deployment notes.
2. Run lightweight product or platform benchmarking when the work changes UX judgment.
   - Required for new check-in flows, raffle/admin interaction patterns, event wall behavior, visual affordances, navigation, or ambiguous product decisions.
   - Check 2-4 relevant products, platform docs, official LINE/Vercel docs, screenshots, or adjacent examples.
   - Record the observed pattern and the project decision in the QA log.
   - Skip benchmarking for narrow bug fixes, copy edits, dependency chores, or user-specified designs.
3. Update release notes or visible docs when the change is user-facing.
   - If the project later gains a changelog, update it for every user-facing release.
   - Until then, record user-facing changes in the QA log and update `README.md` when usage, routes, setup, or operations change.
4. Run QA and save the result.
   - Use `docs/release/agent_qa_template.md`.
   - Save the log as `docs/release/agent_qa-YYYY-MM-DD-<scope>.md` or `docs/release/agent_qa-YYYY-MM-DD-vX.Y.Z.md`.
   - Use Playwright when practical; otherwise use the Codex in-app browser and document the fallback.
   - Capture screenshots for changed visual surfaces.
   - Include DOM assertions, console checks, and behavior checks that prove the intended outcome.
5. Run a separate code review against the current diff when the change is non-trivial or release-bound.
   - Use a PR review stance: findings first, severity labels, file/line references, and focus on bugs, regressions, missing tests, security, privacy, and release risks.
   - If a separate agent is not available or conflicts with tool policy, perform a local review and record that limitation.
6. Run local verification:
   - `git diff --check`
   - `npm run build`
   - `find api -maxdepth 1 -type f -name '*.ts' | wc -l` and confirm the count is 12 or fewer for Vercel Hobby.
   - `node --check` for changed JavaScript files when applicable.
   - API smoke checks for changed Vercel functions when feasible.
   - Browser checks for changed routes, including `/`, `/admin`, `/admin/raffle`, `/admin/wall`, and `/wall` when relevant.
7. Resolve all blocking QA failures and review findings before declaring GSD done.
8. Save the final review log as `docs/release/agent_codereview-YYYY-MM-DD-<scope>.md` or `docs/release/agent_codereview-YYYY-MM-DD-vX.Y.Z.md`.

## Architecture Overview

### Core Application Structure

- `src/App.tsx`: Route switch for public LIFF flow, admin pages, raffle admin, and wall pages.
- `src/contexts/LiffContext.tsx`: LINE LIFF initialization, login, and profile state.
- `src/pages/VerifyPage.tsx`: GeoIP and GPS verification.
- `src/pages/MainPage.tsx`: User-facing checked-in menu.
- `src/pages/AdminHubPage.tsx`: Admin entry point.
- `src/pages/AdminPage.tsx`: Raffle administration.
- `src/pages/AdminWallPage.tsx`: Event wall administration.
- `src/pages/WallPage.tsx`: Public wall display.
- `src/hooks/useHeartbeat.ts`: Presence TTL refresh.
- `api/*.ts`: Vercel serverless functions for check-in, presence, raffle state, notification, wall messages, and LINE webhook.

### Data And Integrations

- LINE LIFF SDK handles event-user identity and profile access.
- Browser Geolocation and GeoIP data contribute to attendance verification.
- Upstash Redis stores presence, raffle state, history, and event wall state.
- LINE Messaging API is used for follow webhook and outbound notifications.
- Vercel rewrites all app routes to `/` through `vercel.json`.

## Common Development Tasks

### Adding Or Changing App Routes

- Update `src/App.tsx`.
- Verify direct route entry locally and, when needed, in Vercel preview because `vercel.json` rewrites all routes to `/`.
- Include browser checks for both initial load and navigation-related state.

### Changing Check-In Or Presence Behavior

- Review the affected API functions and `useHeartbeat`.
- Verify Redis key TTL assumptions, missing credential handling, and anonymous/dev-mode behavior.
- Confirm that stale sessions age out and that active-session endpoints do not expose unnecessary profile data.

### Changing Raffle Behavior

- Exercise admin setup, active participant list, draw, confirmation countdown, reroll, and result persistence where relevant.
- Check that partial failures in notification or Redis calls leave a recoverable admin state.

### Changing LINE Or Webhook Behavior

- Verify signature handling and missing-secret behavior.
- Do not log sensitive request headers, tokens, or profile data.
- Prefer small, auditable changes because webhook mistakes can affect production users quickly.

### Styling And Frontend UX

- Follow the existing React/Tailwind patterns and CSS variables in `src/index.css`.
- Check mobile LIFF-sized screens and desktop admin screens separately.
- Changed visual surfaces need screenshot evidence in the QA log for GSD.
