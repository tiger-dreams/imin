# Agent Code Review - <version or release name>

Date: <YYYY-MM-DD>
Scope: <short description of the diff reviewed before commit/push>

## Review Method

- Review the current diff from a PR review perspective.
- Lead with findings, ordered by severity.
- Focus on bugs, regressions, missing tests, security, privacy, reliability, and release risks.
- For UX-heavy changes, verify that implementation matches any recorded product/platform benchmarking decision.
- Run or cross-check local verification:
  - `git diff --check`
  - `npm run build`
  - `find api -maxdepth 1 -type f -name '*.ts' | wc -l` and confirm the count is 12 or fewer for Vercel Hobby
  - `node --check` for changed JavaScript files when applicable
  - API smoke checks for changed Vercel functions when feasible
  - Browser route checks for changed UI surfaces

## Findings

### <severity>: <finding title>

<Describe the issue with file/line references.>

Resolution:

- <Describe what changed, or why the risk was accepted.>

## No Blocking Findings

State whether P0/P1/P2 blocking findings were found.

Areas checked:

- <area>
- <area>
- <area>

## Verification

Latest local result:

```text
<paste high-signal command output summary>
```

Residual risk:

- <known limitation, if any>
