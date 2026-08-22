# BG-01M0J70K: The mutation gate cannot execute: Stryker's vitest runner finds no tests in its sandbox

> **Status:** Fixed
> **Triaged-by:** anton-reis; persona; v1
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** ./stryker.conf.json, ./vitest.config.ts, scripts/check-mutation-config.mjs
> **Severity:** High
> **Verification depth:** functional
> **Points:** 3

## Summary

D0015 makes a 70% mutation score a BLOCKING gate. It has never run. `pnpm test:mutation` fails with `No tests were executed. Stryker will exit prematurely.` even though the plugin now loads, the sandbox is correctly populated, and running `npx vitest run` INSIDE that same sandbox passes 3/3. Diagnosed, not guessed: (1) the original failure was `Cannot find TestRunner plugin "vitest"` - pnpm's non-flat `node_modules` defeats Stryker's plugin auto-discovery, fixed by an explicit `plugins` entry; (2) the remaining failure is the vitest runner's own test discovery. Ruled out: git tracking of test files (`git add -N` changed nothing), the `since` changed-file scope (removing it changed nothing), `coverageAnalysis: perTest` (setting it to `off` changed nothing), a core/runner version mismatch (both resolve to 9.6.1), and Vitest 4 specifically (reproduced identically on Vitest 3.2.7). The runner's peer range is `vitest: '>=2.0.0'` with no upper bound, so it claims support for Vitest 3 and 4 by omission rather than by testing - the same pattern that made vitest-axe unusable (D0032).

## Steps to Reproduce

1. pnpm build. 2. npx stryker run. 3. Observe `INFO DryRunExecutor No tests were found` then `ConfigError: No tests were executed`. 4. ls .stryker-tmp/sandbox-*/test/ - the test files ARE there. 5. cd into that sandbox and run `npx vitest run` - 3/3 pass.

## Proposed Fix

Investigate the vitest-runner's discovery path (it drives vitest through `ctx.projects` and sets `dir` from `vitest.dir`). Candidate remedies, in order of preference: set `vitest.dir` explicitly; pin the runner to a version integration-tested against the installed Vitest; or replace the runner. Until it executes, D0015's gate is aspirational - which is the precise failure mode D0015 was written to prevent.

## Acceptance Criteria

### AC1: The gate runs

- [x] `pnpm test:mutation` runs to completion and reports a mutation score.
- **Verify:** shell node scripts/check-mutation-config.mjs
- **Verification target:** functional

### AC2: The guard runs Stryker rather than inspecting config shape

- [x] `scripts/check-mutation-config.mjs` executes a real Stryker dry run and fails when the runner cannot execute.
- **Verify:** shell node -e "if(!/--dryRunOnly/.test(require('fs').readFileSync('scripts/check-mutation-config.mjs','utf8')))process.exit(1)"
- **Verification target:** functional

### AC3: The gate is proven able to FAIL

- [x] A deliberately weak assertion leaves surviving mutants and the score drops below the 70 break threshold.
- **Verify:** manual a probe module with a one-branch test produced `Final mutation score 23.53 under breaking threshold 70, setting exit code to 1 (failure)`
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created via `new` (deterministic) |

## Root Cause

**`vitest.related` defaults to `true`.** Stryker therefore runs `vitest --related <mutated file>`;
nothing imports `packages/*/src/index.ts`, so zero tests are discovered and the gate reports a NaN
score and passes. The runner prints the answer in its own warning:

```
WARN VitestTestRunner Vitest failed to find test files related to mutated files.
Either disable `vitest.related` or import your source files directly from your test files.
```

**None of the causes this bug originally listed as "ruled out" was responsible.** The diagnosis
enumerated git tracking, `since` scope, `coverageAnalysis`, a version mismatch and Vitest 3 vs 4 -
all correctly eliminated, and all beside the point. Found by the anton-reis seat in round 5, from
the warning text this bug's author had already seen and not read.

Fix: `"vitest": { "configFile": "vitest.config.ts", "related": false }`. One line.

A second defect surfaced alongside it: `since` is not a Stryker option at all, so D0015's
changed-file scope was never in force. Recorded as **D0034**.

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Fixed. Root cause `vitest.related: true`; all three ACs met - dry run discovers 3 tests, guard runs Stryker, and a weak test drives the score to 23.53 against the 70 break threshold. |
