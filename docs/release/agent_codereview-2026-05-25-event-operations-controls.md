# Agent Code Review - Event Operations Controls

Date: 2026-05-25
Scope: Event creation validation, field check-in visibility, host/admin applicant management, overbooking, application windows, release notes, and PMM blog updates

## Review Method

Reviewed the current diff from a PR review perspective, focusing on permission boundaries, server/client parity, event capacity logic, local fallback behavior, release documentation, and Vercel Hobby function-count constraints.

## Findings

### P2: Host-only applicant operations needed API enforcement

`src/pages/EventPlatformPage.tsx` hid applicant management for non-hosts, but the original API path for all participations could still return applicant lists without verifying host/admin identity. The status update endpoint also depended on client behavior for host decisions.

Resolution:

- `api/events.ts` now requires `requesterUserId` for full participation-list reads and checks the requester against host/admin identity.
- Participation writes now accept `actorUserId`, reject cross-user writes from non-managers, and restrict guest-controlled application status changes.
- Server-side checks now enforce application window, application limit, and confirmation limit for new applications or new confirmations.

### P3: Admin role source is not durable

Admin identity is configured by comma-separated environment variables. This is acceptable for the current hackathon/MVP deployment surface, but it is not sufficient for a larger multi-host product.

Resolution:

- Documented `VITE_IMIN_ADMIN_USER_IDS` and `IMIN_ADMIN_USER_IDS` in README and AGENTS.
- Recorded the role-store/audit-log need as residual risk.

## No Blocking Findings

No P0/P1/P2 blocking findings remain after the API permission and limit checks were added.

Areas checked:

- Guest vs host applicant-management visibility
- API participation-list authorization
- API participation write authorization
- Application limit and window behavior
- Confirmation limit and overbooking calculation
- Event creation form persistence
- Release notes and blog updates
- Vercel API function count

## Verification

Latest local result:

```text
git diff --check: pass
npm run build: pass
find api -maxdepth 1 -type f -name '*.ts' | wc -l: 12
Playwright DOM checks: pass
Browser console errors: none
```

Residual risk:

- Admin authorization is still environment-variable based.
- There is no audit log for approval, waitlist, reject, or overbooking decisions.
- Production API smoke with real Upstash credentials was not run locally.
