# Release Gate Workflow

Before declaring GSD done for a release, production fix, commit, or push, complete this gate and save the QA/review records in this directory.

## Definition Of Done

For this repository:

- **Implementation complete** means the code/docs changes are made, but the release gate may still be open.
- **GSD done / release-ready** means docs, QA, review, blocking finding resolution, and final verification are complete. This is the push-ready state.
- **Released** means the user explicitly asked to push, the push completed, and deployment or preview verification is done when applicable.

Do not call a release task done until it is release-ready. Do not push unless the user explicitly asks for push.

## Required Before GSD Done Or Push

1. Confirm scope and version posture.
   - If this is a versioned release, update `package.json`.
   - This repository currently has no tracked lockfile; do not invent one solely for the release gate unless dependency changes require it.
   - Check `README.md` and visible docs for stale feature descriptions, route names, environment variables, setup steps, and deployment notes.
2. Run lightweight product/platform benchmarking when the work changes UX judgment.
   - Required for new check-in flows, raffle/admin interaction models, wall display behavior, visual affordances, navigation/information architecture, or ambiguous product decisions.
   - Check 2-4 relevant products, adjacent event tools, official LINE/Vercel docs, screenshots, or help pages.
   - Summarize the common pattern, notable exceptions, and the decision this project will adopt.
   - Record the benchmark summary in the QA log or a dedicated note when it materially affects implementation.
3. Update release notes or visible docs.
   - If the project later gains a changelog, update it for every user-facing release.
   - Until then, update `README.md` when behavior, routes, setup, operations, or environment variables change.
   - Record user-facing release notes in the QA log.
4. Run QA and save the result.
   - Use `docs/release/agent_qa_template.md`.
   - Save the log as `docs/release/agent_qa-YYYY-MM-DD-<scope>.md` or `docs/release/agent_qa-YYYY-MM-DD-vX.Y.Z.md`.
   - Use Playwright when available and practical; otherwise use the Codex in-app browser and document the fallback.
   - Capture screenshots for changed visual surfaces.
   - Include DOM assertions, console checks, route checks, API checks, and behavior checks that prove the intended outcome.
5. Run a separate code review against the current diff when the change is non-trivial or release-bound.
   - Use a PR review stance: findings first, severity labels, file/line references, and focus on bugs, regressions, missing tests, security, privacy, and release risks.
   - If a separate review agent is unavailable or conflicts with higher-priority tool policy, perform a local review and record the limitation.
6. Run local verification:
   - `git diff --check`
   - `npm run build`
   - `find api -maxdepth 1 -type f -name '*.ts' | wc -l` and confirm the count is 12 or fewer for Vercel Hobby.
   - `node --check` for changed JavaScript files when applicable
   - API smoke checks for changed Vercel functions when feasible
   - Browser checks for changed routes, including `/`, `/admin`, `/admin/raffle`, `/admin/wall`, and `/wall` when relevant
7. Resolve all blocking QA failures and review findings before declaring GSD done or pushing.
8. Save the final review log as `docs/release/agent_codereview-YYYY-MM-DD-<scope>.md` or `docs/release/agent_codereview-YYYY-MM-DD-vX.Y.Z.md`.

## Required Files Per GSD Release

```text
docs/release/agent_qa-YYYY-MM-DD-<scope>.md
docs/release/agent_codereview-YYYY-MM-DD-<scope>.md
```

Use a semantic version in the filename when the release is versioned.
