# US-01M0GM3X: Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./playwright.config.ts, ./size-limit.json, ./stryker.conf.json, ./vitest.config.ts
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** the full test toolchain wired and running against an empty component set
**So that** every later component story inherits a working harness instead of building one

## Acceptance Criteria

### AC1: Unit harness runs

- **Given** the workspace
- **When** I run `pnpm test`
- **Then** Vitest with RTL and jsdom executes and reports coverage for statements and branches
- **Verify:** shell pnpm test -- --run
- **Verification target:** functional

### AC2: Coverage gates are set

- **Given** the config
- **When** coverage falls below 90% statements or 85% branches
- **Then** the run fails (D0014)
- **Verify:** grep "statements: 90" vitest.config.ts
- **Verification target:** functional

### AC3: Mutation gate is configured

- **Given** the Stryker config
- **When** I inspect it
- **Then** scope is changed files and the threshold is 70, set to break the build (D0015)
- **Verify:** grep "break: 70" stryker.conf.json
- **Verification target:** functional

### AC4: Playwright and size-limit run

- **Given** the workspace
- **When** I run the CI-only suites
- **Then** both execute and report
- **Verify:** file playwright.config.ts
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
